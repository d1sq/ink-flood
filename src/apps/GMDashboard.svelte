<script lang="ts">
  import { cycleState, formattedTime, minutesUntilFlood, activeGlitch, discoveryState, syncFromSettings } from '../stores';
  import { advanceTime, completeEvent } from '../engine/clock-engine';
  import { startNewCycle, initializeFirstCycle } from '../engine/cycle-engine';
  import { earnToken, spendTokens, getTokens, getSpentThisCycle } from '../engine/insight-engine';
  import { getInkTraceTier, getWatcherMarkTier, INK_TRACE_EFFECTS, WATCHER_MARK_EFFECTS } from '../engine/glitch-engine';
  import { getEvent, getEventForCycle, formatTime, LOCATION_NAMES } from '../data/events';
  import { MODULE_ID, MAX_CYCLES, MAX_INSIGHT_PER_CYCLE, TRAVEL_MATRIX } from '../constants';
  import type { EventId, DiscoveryState, NpcInteractionId } from '../types';
  import { getInteractionsByNpc, getActiveHints } from '../data/npc-memory';

  let activeTab = 'time';
  let customMinutes = 30;

  // === PARTY GROUPS ===
  interface PartyGroup {
    id: number;
    name: string;
    members: string;
    currentLocation: string;
    destination: string;
    calculatedTime: number | null;
  }

  let groupIdCounter = 1;
  let groups: PartyGroup[] = [
    { id: 0, name: 'Вся партия', members: '', currentLocation: 'square', destination: '', calculatedTime: null },
  ];

  const locationKeys = Object.keys(TRAVEL_MATRIX);

  function calculateTravelTime(from: string, to: string, cycle: number): number {
    if (!from || !to || from === to) return 0;
    const base = TRAVEL_MATRIX[from]?.[to] ?? TRAVEL_MATRIX[to]?.[from] ?? 15;
    // Later cycles = faster (players know the city). -1 min per cycle after 1, min 60% of base
    const cycleDiscount = Math.min((cycle - 1) * 1, base * 0.4);
    const adjusted = Math.max(Math.round(base - cycleDiscount), 3);
    // Random ±3 min
    const jitter = Math.floor(Math.random() * 7) - 3;
    return Math.max(1, adjusted + jitter);
  }

  function handleGroupDestination(group: PartyGroup) {
    if (group.destination && group.destination !== group.currentLocation) {
      group.calculatedTime = calculateTravelTime(group.currentLocation, group.destination, $cycleState.cycle);
    } else {
      group.calculatedTime = null;
    }
    groups = groups; // trigger reactivity
  }

  function addGroup() {
    groups = [...groups, {
      id: groupIdCounter++,
      name: `Группа ${groups.length + 1}`,
      members: '',
      currentLocation: 'square',
      destination: '',
      calculatedTime: null,
    }];
  }

  function removeGroup(id: number) {
    groups = groups.filter(g => g.id !== id);
  }

  async function applyGroupTravel() {
    const maxTime = Math.max(...groups.map(g => g.calculatedTime ?? 0));
    if (maxTime <= 0) return;
    await advanceTime(maxTime);
    // Move groups to their destinations
    for (const g of groups) {
      if (g.destination && g.calculatedTime) {
        g.currentLocation = g.destination;
        g.destination = '';
        g.calculatedTime = null;
      }
    }
    groups = groups;
    syncFromSettings();
  }

  // === EVENTS ===
  let expandedEvent: EventId | null = null;
  function toggleEventExpand(id: EventId) {
    expandedEvent = expandedEvent === id ? null : id;
  }

  // === INSIGHT TOKENS ===
  let playerTokens: { name: string; actor: any; tokens: number; spent: number }[] = [];
  function refreshPlayerTokens() {
    const actors = (game as any).actors?.filter((a: any) => a.hasPlayerOwner) ?? [];
    playerTokens = actors.map((a: any) => ({
      name: a.name, actor: a,
      tokens: getTokens(a), spent: getSpentThisCycle(a),
    }));
  }

  // === DISCOVERIES ===
  let discoveryNotes = '';
  discoveryState.subscribe(d => { discoveryNotes = d.notes; });

  const SLOT_LABELS: Record<string, string> = { matter: 'Материя', word: 'Слово', vision: 'Зрение' };
  const KEY_NAMES: Record<string, string> = {
    'dawn-lens': 'Заря (линза)', 'glass-key': 'Стеклянный Ключ', 'seal': 'Печать',
    'prayer': 'Молитва Отмены', 'coin': 'Монета Сиверна', 'confession': 'Признание Убийцы',
    'truth-lens': 'Линза Истины', 'oath': 'Клятва Хранителя', 'lighthouse-eye': 'Око Башни',
  };

  const tabs = [
    { id: 'time', label: 'Время' },
    { id: 'events', label: 'События' },
    { id: 'tokens', label: 'Токены' },
    { id: 'npc', label: 'НИП' },
    { id: 'notes', label: 'Заметки' },
  ];

  // === NPC MEMORY ===
  const npcGroups = getInteractionsByNpc();

  async function handleNpcIncrement(id: NpcInteractionId) {
    const state = (game as any).settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    if (!state.npcMemory) state.npcMemory = {};
    state.npcMemory[id] = (state.npcMemory[id] ?? 0) + 1;
    await (game as any).settings.set(MODULE_ID, 'discoveryState', state);
    syncFromSettings();
  }

  async function handleNpcDecrement(id: NpcInteractionId) {
    const state = (game as any).settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    if (!state.npcMemory) state.npcMemory = {};
    state.npcMemory[id] = Math.max(0, (state.npcMemory[id] ?? 0) - 1);
    await (game as any).settings.set(MODULE_ID, 'discoveryState', state);
    syncFromSettings();
  }

  $: npcMemory = $discoveryState.npcMemory ?? {};
  $: activeNpcHints = getActiveHints(npcMemory);

  async function handleAdvance(mins: number) {
    await advanceTime(mins);
    syncFromSettings();
  }

  async function handleNewCycle() {
    if ($cycleState.cycle === 0) {
      await initializeFirstCycle();
    } else {
      await startNewCycle();
    }
    // Reset groups
    groups = [{ id: 0, name: 'Вся партия', members: '', currentLocation: 'square', destination: '', calculatedTime: null }];
    syncFromSettings();
  }

  function handleShowClockToAll() {
    (game as any).socket!.emit(`module.${MODULE_ID}`, { action: 'showClock' });
    (globalThis as any).InkFlood?.openClock();
  }

  async function handleCompleteEvent(eventId: EventId) {
    await completeEvent(eventId);
    syncFromSettings();
  }

  function getStatusLabel(status: string): string {
    return ({ available: 'Доступно', completed: '✓', missed: 'Пропущено', unavailable: '—' })[status] ?? status;
  }

  async function handleEarnToken(actor: any) { await earnToken(actor); refreshPlayerTokens(); }
  async function handleSpendToken(actor: any, cost: number) {
    if (!(await spendTokens(actor, cost))) ui.notifications?.warn('Недостаточно токенов или лимит');
    refreshPlayerTokens();
  }

  async function handleToggleDiscovery(key: string, field: 'towerSlots') {
    const state = (game as any).settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    (state.towerSlots as any)[key] = !(state.towerSlots as any)[key];
    await (game as any).settings.set(MODULE_ID, 'discoveryState', state);
    syncFromSettings();
  }

  async function handleSaveNotes() {
    const state = (game as any).settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    state.notes = discoveryNotes;
    await (game as any).settings.set(MODULE_ID, 'discoveryState', state);
  }

  $: availableEvents = $cycleState.events.filter(e => e.status !== 'unavailable');
  $: collectedCount = [$cycleState.keys.matter, $cycleState.keys.word, $cycleState.keys.vision].filter(Boolean).length;
  $: inkTier = getInkTraceTier($cycleState.cycle);
  $: watcherTier = getWatcherMarkTier($cycleState.cycle);
  $: if (activeTab === 'tokens') refreshPlayerTokens();
  $: maxGroupTime = Math.max(...groups.map(g => g.calculatedTime ?? 0), 0);
</script>

<div class="ink-flood-dashboard">
  <header class="dashboard-header">
    <div class="cycle-info">
      <span class="cycle-number">Цикл {$cycleState.cycle}/{MAX_CYCLES}</span>
      <span class="time-display">{$formattedTime}</span>
      <span class="flood-countdown" class:urgent={$minutesUntilFlood <= 60}>
        До потопа: {$minutesUntilFlood} мин
      </span>
    </div>
    <div class="header-right">
      <span class="keys-summary">{collectedCount}/3</span>
      {#if $activeGlitch}
        <span class="glitch-badge">DC+{$activeGlitch.dcModifier}</span>
      {/if}
    </div>
  </header>

  <nav class="dashboard-tabs">
    {#each tabs as tab}
      <button class="tab-btn" class:active={activeTab === tab.id} on:click={() => activeTab = tab.id}>
        {tab.label}
      </button>
    {/each}
  </nav>

  <main class="dashboard-content">

    <!-- ======= ВРЕМЯ / TIME MANAGEMENT ======= -->
    {#if activeTab === 'time'}
      <section class="tab-time">
        <!-- Cycle & Clock controls -->
        <div class="section-row">
          <button class="btn-primary" on:click={handleNewCycle}>
            {$cycleState.cycle === 0 ? 'Начать цикл 1' : 'Новый цикл'}
          </button>
          <button class="btn-secondary" on:click={handleShowClockToAll}>Часы всем</button>
        </div>

        <!-- Quick advance -->
        <div class="section-block">
          <h3>Быстрое продвижение</h3>
          <div class="time-buttons">
            <button on:click={() => handleAdvance(10)}>+10</button>
            <button on:click={() => handleAdvance(15)}>+15</button>
            <button on:click={() => handleAdvance(30)}>+30</button>
            <div class="custom-time">
              <input type="number" bind:value={customMinutes} min="1" max="120" />
              <button on:click={() => handleAdvance(customMinutes)}>+{customMinutes}</button>
            </div>
          </div>
        </div>

        <!-- Flood -->
        {#if $cycleState.floodPhase > 0}
          <div class="flood-indicator phase-{$cycleState.floodPhase}">
            Потоп: фаза {$cycleState.floodPhase}/5
          </div>
        {/if}

        <!-- Party Groups -->
        <div class="section-block">
          <div class="section-header">
            <h3>Группы</h3>
            <button class="btn-small" on:click={addGroup}>+ Группа</button>
          </div>

          {#each groups as group, i}
            <div class="group-card">
              <div class="group-header">
                <input class="group-name-input" bind:value={group.name} placeholder="Название" />
                <input class="group-members-input" bind:value={group.members} placeholder="Участники..." />
                {#if groups.length > 1}
                  <button class="btn-remove" on:click={() => removeGroup(group.id)}>✕</button>
                {/if}
              </div>
              <div class="group-travel">
                <div class="travel-select">
                  <label>Сейчас:</label>
                  <select bind:value={group.currentLocation} on:change={() => handleGroupDestination(group)}>
                    {#each locationKeys as loc}
                      <option value={loc}>{LOCATION_NAMES[loc] ?? loc}</option>
                    {/each}
                  </select>
                </div>
                <span class="travel-arrow">→</span>
                <div class="travel-select">
                  <label>Куда:</label>
                  <select bind:value={group.destination} on:change={() => handleGroupDestination(group)}>
                    <option value="">—</option>
                    {#each locationKeys as loc}
                      {#if loc !== group.currentLocation}
                        <option value={loc}>{LOCATION_NAMES[loc] ?? loc}</option>
                      {/if}
                    {/each}
                  </select>
                </div>
                {#if group.calculatedTime !== null}
                  <span class="travel-result">~{group.calculatedTime} мин</span>
                {/if}
              </div>
            </div>
          {/each}

          {#if maxGroupTime > 0}
            <button class="btn-primary apply-travel" on:click={applyGroupTravel}>
              Применить перемещение (+{maxGroupTime} мин)
            </button>
          {/if}
        </div>
      </section>

    <!-- ======= СОБЫТИЯ ======= -->
    {:else if activeTab === 'events'}
      <section class="tab-events">
        <!-- Key slots at top of events -->
        <div class="key-slots-bar">
          {#each ['matter', 'word', 'vision'] as slot}
            <div class="key-slot" class:filled={$cycleState.keys[slot]}>
              <span class="slot-label">{SLOT_LABELS[slot]}</span>
              <span class="slot-value">
                {$cycleState.keys[slot] ? KEY_NAMES[$cycleState.keys[slot]] : '—'}
              </span>
            </div>
          {/each}
        </div>

        <h3>События цикла {$cycleState.cycle}</h3>
        {#each availableEvents as ev}
          {@const def = getEventForCycle(ev.id, $cycleState.cycle)}
          <div class="event-card status-{ev.status}">
            <div class="event-row" on:click={() => toggleEventExpand(ev.id)}>
              <span class="event-expand">{expandedEvent === ev.id ? '▼' : '▶'}</span>
              <span class="event-time">{formatTime(ev.actualTime)}</span>
              <span class="event-name">{def.shortDescription}</span>
              <span class="event-slot-badge">{SLOT_LABELS[def.slot]}</span>
              <span class="event-status">{getStatusLabel(ev.status)}</span>
              {#if ev.status === 'available'}
                <button class="btn-complete" on:click|stopPropagation={() => handleCompleteEvent(ev.id)}>✓</button>
              {/if}
            </div>
            {#if expandedEvent === ev.id}
              <div class="event-details">
                <p class="event-description">{def.description}</p>
                <pre class="event-hints">{def.gmHints}</pre>
              </div>
            {/if}
          </div>
        {/each}
      </section>

    <!-- ======= ТОКЕНЫ ======= -->
    {:else if activeTab === 'tokens'}
      <section class="tab-tokens">
        <h3>Инсайт-токены (макс {MAX_INSIGHT_PER_CYCLE}/цикл)</h3>
        {#each playerTokens as p}
          <div class="token-row">
            <span class="token-name">{p.name}</span>
            <span class="token-balance">{p.tokens}</span>
            <span class="token-spent">({p.spent}/{MAX_INSIGHT_PER_CYCLE})</span>
            <button class="btn-token earn" on:click={() => handleEarnToken(p.actor)}>+1</button>
            <button class="btn-token spend" on:click={() => handleSpendToken(p.actor, 1)}>−1</button>
            <button class="btn-token spend2" on:click={() => handleSpendToken(p.actor, 2)}>−2</button>
          </div>
        {/each}
        {#if playerTokens.length === 0}
          <p class="empty-hint">Нет персонажей игроков в мире</p>
        {/if}
        <div class="token-legend">
          <p><strong>1:</strong> преимущество на проверку / DC −2</p>
          <p><strong>2:</strong> вопрос ГМу «да/нет» про тайминг</p>
        </div>
      </section>

    <!-- ======= НИП ПАМЯТЬ ======= -->
    {:else if activeTab === 'npc'}
      <section class="tab-npc">
        {#if activeNpcHints.length > 0}
          <div class="npc-hints-block">
            <h3>Подсказки на этот цикл</h3>
            {#each activeNpcHints as hint}
              <div class="npc-hint">
                <span class="npc-hint-name">{hint.npc}:</span>
                <span class="npc-hint-text">{hint.text}</span>
              </div>
            {/each}
          </div>
        {/if}

        <h3>Взаимодействия</h3>
        {#each [...npcGroups] as [npcName, interactions]}
          <div class="npc-group">
            <h4>{npcName}</h4>
            {#each interactions as def}
              <div class="npc-interaction-row">
                <span class="npc-int-label">{def.label}</span>
                <span class="npc-int-count">{npcMemory[def.id] ?? 0}</span>
                <button class="btn-npc" on:click={() => handleNpcIncrement(def.id)}>+</button>
                <button class="btn-npc dim" on:click={() => handleNpcDecrement(def.id)}>−</button>
              </div>
            {/each}
          </div>
        {/each}
      </section>

    <!-- ======= ОТКРЫТИЯ ======= -->
    {:else if activeTab === 'notes'}
      <section class="tab-notes">
        {#if $activeGlitch}
          <div class="glitch-block">
            <h3>Глитчи — Цикл {$cycleState.cycle}</h3>
            <p><strong>DC:</strong> +{$activeGlitch.dcModifier}</p>
            {#if $activeGlitch.floodTimeShift !== 0}
              <p><strong>Потоп:</strong> {$activeGlitch.floodTimeShift} мин сдвиг</p>
            {/if}
            <ul>
              {#each $activeGlitch.descriptions as desc}
                <li>{desc}</li>
              {/each}
            </ul>
          </div>
        {/if}
        <h3>Заметки</h3>
        <textarea bind:value={discoveryNotes} on:blur={handleSaveNotes}
          placeholder="Что партия узнала, кому доверяют, планы на следующий цикл..." rows="10"></textarea>
      </section>
    {/if}
  </main>
</div>

<style>
  /* Base */
  .ink-flood-dashboard { display: flex; flex-direction: column; height: 100%; color: #e0e0e0; font-size: 17px; font-weight: 600; }

  /* Header */
  .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #1a1a2e; border-bottom: 1px solid #333; }
  .cycle-info { display: flex; gap: 14px; align-items: center; }
  .cycle-number { font-weight: 700; font-size: 1.1em; }
  .time-display { font-size: 1.35em; font-weight: 800; color: #c0c0ff; }
  .flood-countdown { font-size: 0.9em; color: #aaa; font-weight: 600; }
  .flood-countdown.urgent { color: #ff6b6b; font-weight: 700; }
  .header-right { display: flex; gap: 10px; align-items: center; }
  .keys-summary { font-weight: 700; color: #ffd700; font-size: 1.1em; }
  .glitch-badge { padding: 2px 8px; background: #2a1a0a; border: 1px solid #ff8c00; border-radius: 3px; color: #ffaa44; font-weight: 700; font-size: 0.85em; }

  /* Tabs */
  .dashboard-tabs { display: flex; background: #16213e; border-bottom: 1px solid #333; }
  .tab-btn { flex: 1; padding: 9px 6px; border: none; background: transparent; color: #888; cursor: pointer; font-weight: 700; font-size: 0.95em; }
  .tab-btn:hover { color: #ccc; background: #1a1a3e; }
  .tab-btn.active { color: #e0e0ff; background: #0f3460; border-bottom: 2px solid #5c7cfa; }

  /* Content */
  .dashboard-content { flex: 1; overflow-y: auto; padding: 14px; background: #0a0a1a; }
  h3 { margin: 0 0 12px 0; color: #c0c0ff; font-size: 1.05em; font-weight: 700; }

  /* Shared buttons */
  .section-row { display: flex; gap: 8px; margin-bottom: 14px; }
  .btn-primary { flex: 1; padding: 10px; background: #0f3460; border: 1px solid #5c7cfa; color: #e0e0ff; border-radius: 4px; cursor: pointer; font-size: 1em; font-weight: 700; }
  .btn-primary:hover { background: #1a3a6e; }
  .btn-secondary { flex: 1; padding: 10px; background: #1a2a3e; border: 1px solid #4a6a8a; color: #aaccee; border-radius: 4px; cursor: pointer; font-size: 1em; font-weight: 700; }
  .btn-secondary:hover { background: #2a3a5e; }
  .btn-small { padding: 4px 10px; background: #16213e; border: 1px solid #333; color: #c0c0ff; border-radius: 3px; cursor: pointer; font-size: 0.85em; font-weight: 600; }
  .btn-remove { padding: 2px 8px; background: #2a1a1a; border: 1px solid #6a2a2a; color: #cc6666; border-radius: 3px; cursor: pointer; font-size: 0.85em; }

  /* Section blocks */
  .section-block { margin-bottom: 16px; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .section-header h3 { margin: 0; }

  /* Time buttons */
  .time-buttons { display: flex; gap: 8px; align-items: center; }
  .time-buttons button { flex: 1; padding: 8px 0; background: #16213e; border: 1px solid #333; color: #c0c0ff; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.95em; }
  .time-buttons button:hover { background: #1a1a4e; border-color: #5c7cfa; }
  .custom-time { display: flex; gap: 4px; align-items: center; flex: 1; }
  .custom-time input { width: 44px; padding: 6px 4px; background: #111; border: 1px solid #333; color: #e0e0e0; border-radius: 4px; text-align: center; font-weight: 600; }
  .custom-time button { flex: 1; }

  /* Flood indicator */
  .flood-indicator { padding: 10px; margin-bottom: 14px; border-radius: 4px; text-align: center; font-weight: 700; font-size: 1.05em; }
  .flood-indicator.phase-1 { background: #1a1a2e; color: #7c7caa; }
  .flood-indicator.phase-2 { background: #1a1a3e; color: #8888cc; }
  .flood-indicator.phase-3 { background: #2a1a3e; color: #aa77cc; }
  .flood-indicator.phase-4 { background: #3a1a2e; color: #cc5555; }
  .flood-indicator.phase-5 { background: #4a0a0a; color: #ff3333; }

  /* Party groups */
  .group-card { padding: 10px; margin-bottom: 8px; background: #111; border: 1px solid #222; border-radius: 4px; }
  .group-header { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
  .group-name-input { flex: 0 0 100px; padding: 4px 8px; background: #0a0a1a; border: 1px solid #333; color: #c0c0ff; border-radius: 3px; font-weight: 700; font-size: 0.9em; }
  .group-members-input { flex: 1; padding: 4px 8px; background: #0a0a1a; border: 1px solid #333; color: #aaa; border-radius: 3px; font-size: 0.85em; }
  .group-travel { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .travel-select { display: flex; flex-direction: column; gap: 2px; }
  .travel-select label { font-size: 0.75em; color: #666; font-weight: 600; }
  .travel-select select { padding: 4px 6px; background: #0a0a1a; border: 1px solid #333; color: #e0e0e0; border-radius: 3px; font-size: 0.9em; }
  .travel-arrow { color: #5c7cfa; font-size: 1.2em; font-weight: 700; margin: 10px 2px 0; }
  .travel-result { padding: 4px 10px; background: #1a2a1a; border: 1px solid #2a6a2a; border-radius: 3px; color: #88cc88; font-weight: 700; font-size: 0.95em; margin-top: 10px; }
  .apply-travel { width: 100%; margin-top: 8px; }

  /* Key slots bar (in events tab) */
  .key-slots-bar { display: flex; gap: 8px; margin-bottom: 14px; }
  .key-slot { flex: 1; padding: 10px 8px; background: #111; border: 1px solid #333; border-radius: 4px; text-align: center; }
  .key-slot.filled { border-color: #ffd700; background: #1a1a0a; }
  .slot-label { display: block; font-size: 0.85em; color: #999; margin-bottom: 4px; font-weight: 600; }
  .slot-value { font-size: 0.95em; font-weight: 600; }

  /* Events */
  .event-card { margin-bottom: 6px; border-radius: 4px; background: #111; border: 1px solid #222; overflow: hidden; }
  .event-card.status-completed { border-color: #2a6a2a; background: #0a1a0a; }
  .event-card.status-missed { border-color: #6a2a2a; background: #1a0a0a; opacity: 0.6; }
  .event-row { display: flex; gap: 6px; align-items: center; padding: 8px 10px; cursor: pointer; }
  .event-row:hover { background: rgba(255,255,255,0.03); }
  .event-expand { color: #666; font-size: 0.7em; min-width: 14px; }
  .event-time { font-weight: 700; color: #c0c0ff; min-width: 44px; }
  .event-name { flex: 1; font-weight: 600; }
  .event-slot-badge { font-size: 0.8em; color: #888; padding: 1px 6px; border: 1px solid #333; border-radius: 2px; }
  .event-status { font-size: 0.9em; color: #aaa; min-width: 30px; text-align: center; font-weight: 600; }
  .btn-complete { padding: 4px 10px; background: #1a3a1a; border: 1px solid #2a6a2a; color: #88cc88; border-radius: 3px; cursor: pointer; font-weight: 700; }
  .event-details { padding: 10px 12px; border-top: 1px solid #222; background: #0a0a14; }
  .event-description { margin: 0 0 8px 0; font-style: italic; color: #aab; font-size: 0.95em; }
  .event-hints { margin: 0; font-family: inherit; font-size: 0.9em; color: #ccc; white-space: pre-wrap; line-height: 1.6; background: none; border: none; padding: 0; }

  /* Tokens */
  .token-row { display: flex; gap: 8px; align-items: center; padding: 8px 10px; margin-bottom: 6px; background: #111; border: 1px solid #222; border-radius: 4px; }
  .token-name { flex: 1; font-weight: 600; }
  .token-balance { font-weight: 700; color: #ffd700; min-width: 28px; text-align: center; font-size: 1.15em; }
  .token-spent { font-size: 0.9em; color: #888; min-width: 44px; font-weight: 600; }
  .btn-token { padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em; border: 1px solid #333; font-weight: 600; }
  .btn-token.earn { background: #1a3a1a; border-color: #2a6a2a; color: #88cc88; }
  .btn-token.spend { background: #2a1a1a; border-color: #6a3a2a; color: #cc9988; }
  .btn-token.spend2 { background: #2a1a2a; border-color: #6a2a6a; color: #cc88cc; }
  .token-legend { margin-top: 14px; padding: 10px; background: #0a0a1a; border: 1px solid #222; border-radius: 4px; }
  .token-legend p { margin: 3px 0; font-size: 0.95em; color: #aaa; }
  .empty-hint { color: #666; font-style: italic; }

  /* Discoveries */
  .discovery-group { margin-bottom: 18px; }
  .discovery-group h4 { margin: 0 0 8px 0; color: #c0c0ff; font-size: 1.05em; font-weight: 700; }
  .discovery-check { display: block; padding: 4px 0; cursor: pointer; color: #ccc; font-size: 1em; }
  .discovery-check input { margin-right: 8px; }
  .mark-effect { font-size: 1em; color: #cca; padding: 8px 10px; background: #111; border-radius: 4px; border: 1px solid #333; }
  textarea { width: 100%; padding: 10px; background: #111; border: 1px solid #333; color: #e0e0e0; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 1em; }

  /* Glitches */
  .tab-glitches ul { padding-left: 20px; }
  .tab-glitches li { margin-bottom: 6px; color: #ccc; }
  .tab-glitches p { font-size: 1em; }

  /* NPC Memory */
  .npc-hints-block { margin-bottom: 18px; padding: 10px; background: #111a11; border: 1px solid #2a4a2a; border-radius: 4px; }
  .npc-hint { margin-bottom: 8px; font-size: 0.95em; line-height: 1.5; }
  .npc-hint-name { font-weight: 700; color: #c0c0ff; margin-right: 4px; }
  .npc-hint-text { color: #ccddcc; font-style: italic; }
  .npc-group { margin-bottom: 14px; }
  .npc-group h4 { margin: 0 0 6px 0; color: #c0c0ff; font-size: 1em; font-weight: 700; border-bottom: 1px solid #222; padding-bottom: 4px; }
  .npc-interaction-row { display: flex; gap: 6px; align-items: center; padding: 4px 0; }
  .npc-int-label { flex: 1; font-size: 0.95em; color: #ccc; }
  .npc-int-count { min-width: 24px; text-align: center; font-weight: 700; color: #ffd700; font-size: 1.05em; }
  .btn-npc { padding: 3px 10px; background: #16213e; border: 1px solid #333; color: #c0c0ff; border-radius: 3px; cursor: pointer; font-weight: 700; font-size: 0.9em; }
  .btn-npc:hover { background: #1a1a4e; border-color: #5c7cfa; }
  .btn-npc.dim { color: #888; }
  .btn-npc.dim:hover { color: #cc8888; border-color: #6a3a3a; }
</style>
