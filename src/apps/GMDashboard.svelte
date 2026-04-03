<script lang="ts">
  import { cycleState, formattedTime, minutesUntilFlood, activeGlitch, discoveryState, syncFromSettings } from '../stores';
  import { advanceTime, completeEvent } from '../engine/clock-engine';
  import { startNewCycle, initializeFirstCycle } from '../engine/cycle-engine';
  import { earnToken, spendTokens, getTokens, getSpentThisCycle } from '../engine/insight-engine';
  import { getInkTraceTier, getWatcherMarkTier, INK_TRACE_EFFECTS, WATCHER_MARK_EFFECTS } from '../engine/glitch-engine';
  import { getEvent, formatTime } from '../data/events';
  import { MODULE_ID, MAX_CYCLES, MAX_INSIGHT_PER_CYCLE } from '../constants';
  import type { EventId, DiscoveryState } from '../types';

  let activeTab = 'overview';
  let customMinutes = 30;

  // Insight tokens state
  let playerTokens: { name: string; actor: any; tokens: number; spent: number }[] = [];

  function refreshPlayerTokens() {
    const actors = (game as any).actors?.filter((a: any) => a.hasPlayerOwner) ?? [];
    playerTokens = actors.map((a: any) => ({
      name: a.name,
      actor: a,
      tokens: getTokens(a),
      spent: getSpentThisCycle(a),
    }));
  }

  // Discovery state binding
  let discoveryNotes = '';
  discoveryState.subscribe(d => { discoveryNotes = d.notes; });

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'events', label: 'События' },
    { id: 'keys', label: 'Ключи' },
    { id: 'tokens', label: 'Токены' },
    { id: 'discoveries', label: 'Открытия' },
    { id: 'glitches', label: 'Глитчи' },
  ];

  const SLOT_LABELS: Record<string, string> = { matter: 'Материя', word: 'Слово', vision: 'Зрение' };
  const KEY_NAMES: Record<string, string> = {
    'dawn-lens': 'Заря (линза)',
    'glass-key': 'Стеклянный Ключ',
    'seal': 'Печать',
    'prayer': 'Молитва Отмены',
    'coin': 'Монета Сиверна',
    'confession': 'Признание Убийцы',
    'truth-lens': 'Линза Истины',
    'oath': 'Клятва Хранителя',
    'lighthouse-eye': 'Око Маяка',
  };

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
    syncFromSettings();
  }

  async function handleCompleteEvent(eventId: EventId) {
    await completeEvent(eventId);
    syncFromSettings();
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      available: 'Доступно', completed: 'Выполнено', missed: 'Пропущено', unavailable: 'Недоступно',
    };
    return map[status] ?? status;
  }

  async function handleEarnToken(actor: any) {
    await earnToken(actor);
    refreshPlayerTokens();
  }

  async function handleSpendToken(actor: any, cost: number) {
    const ok = await spendTokens(actor, cost);
    if (!ok) {
      ui.notifications?.warn('Недостаточно токенов или лимит за цикл');
    }
    refreshPlayerTokens();
  }

  async function handleToggleDiscovery(key: string, field: 'towerSlots' | 'knownKeys' | 'npcTrust') {
    const state = (game as any).settings.get(MODULE_ID, 'discoveryState') as DiscoveryState;
    if (field === 'towerSlots') {
      (state.towerSlots as any)[key] = !(state.towerSlots as any)[key];
    }
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
</script>

<div class="ink-flood-dashboard">
  <header class="dashboard-header">
    <div class="cycle-info">
      <span class="cycle-number">Цикл {$cycleState.cycle} / {MAX_CYCLES}</span>
      <span class="time-display">{$formattedTime}</span>
      <span class="flood-countdown" class:urgent={$minutesUntilFlood <= 60}>
        До потопа: {$minutesUntilFlood} мин
      </span>
    </div>
    <div class="keys-summary">{collectedCount} / 3 ключей</div>
  </header>

  <nav class="dashboard-tabs">
    {#each tabs as tab}
      <button class="tab-btn" class:active={activeTab === tab.id} on:click={() => activeTab = tab.id}>
        {tab.label}
      </button>
    {/each}
  </nav>

  <main class="dashboard-content">
    {#if activeTab === 'overview'}
      <section class="tab-overview">
        <div class="time-controls">
          <h3>Время</h3>
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

        <div class="cycle-controls">
          <button class="btn-new-cycle" on:click={handleNewCycle}>
            {$cycleState.cycle === 0 ? 'Начать цикл 1' : 'Новый цикл'}
          </button>
        </div>

        {#if $cycleState.floodPhase > 0}
          <div class="flood-indicator phase-{$cycleState.floodPhase}">
            Потоп: фаза {$cycleState.floodPhase} / 5
          </div>
        {/if}

        {#if $activeGlitch}
          <div class="glitch-notice">DC +{$activeGlitch.dcModifier}</div>
        {/if}

        <div class="key-slots-overview">
          {#each ['matter', 'word', 'vision'] as slot}
            <div class="key-slot" class:filled={$cycleState.keys[slot]}>
              <span class="slot-label">{SLOT_LABELS[slot]}</span>
              <span class="slot-value">
                {$cycleState.keys[slot] ? KEY_NAMES[$cycleState.keys[slot]] : '—'}
              </span>
            </div>
          {/each}
        </div>
      </section>

    {:else if activeTab === 'events'}
      <section class="tab-events">
        <h3>События цикла {$cycleState.cycle}</h3>
        {#each availableEvents as ev}
          {@const def = getEvent(ev.id)}
          <div class="event-row status-{ev.status}">
            <span class="event-time">{formatTime(ev.actualTime)}</span>
            <span class="event-name">{def.shortDescription}</span>
            <span class="event-slot">{SLOT_LABELS[def.slot]}</span>
            <span class="event-status">{getStatusLabel(ev.status)}</span>
            {#if ev.status === 'available'}
              <button class="btn-complete" on:click={() => handleCompleteEvent(ev.id)}>Done</button>
            {/if}
          </div>
        {/each}
      </section>

    {:else if activeTab === 'keys'}
      <section class="tab-keys">
        <h3>Ключи</h3>
        {#each ['matter', 'word', 'vision'] as slot}
          <div class="key-detail" class:filled={$cycleState.keys[slot]}>
            <h4>{SLOT_LABELS[slot]}</h4>
            {#if $cycleState.keys[slot]}
              <p class="key-name">{KEY_NAMES[$cycleState.keys[slot]]}</p>
            {:else}
              <p class="key-empty">Не собран</p>
            {/if}
          </div>
        {/each}
      </section>

    {:else if activeTab === 'tokens'}
      <section class="tab-tokens">
        <h3>Инсайт-токены (макс {MAX_INSIGHT_PER_CYCLE}/цикл)</h3>
        {#each playerTokens as p}
          <div class="token-row">
            <span class="token-name">{p.name}</span>
            <span class="token-balance">{p.tokens}</span>
            <span class="token-spent">({p.spent}/{MAX_INSIGHT_PER_CYCLE})</span>
            <button class="btn-token earn" on:click={() => handleEarnToken(p.actor)}>+1</button>
            <button class="btn-token spend" on:click={() => handleSpendToken(p.actor, 1)} title="Преимущество или DC-2">Потратить</button>
            <button class="btn-token spend2" on:click={() => handleSpendToken(p.actor, 2)} title="Вопрос ГМу да/нет">×2</button>
          </div>
        {/each}
        {#if playerTokens.length === 0}
          <p class="empty-hint">Нет персонажей игроков в мире</p>
        {/if}
        <div class="token-legend">
          <p><strong>1 токен:</strong> преимущество на проверку / DC −2</p>
          <p><strong>2 токена:</strong> вопрос ГМу «да/нет» про тайминг</p>
        </div>
      </section>

    {:else if activeTab === 'discoveries'}
      <section class="tab-discoveries">
        <h3>Открытия (кросс-цикл)</h3>

        <div class="discovery-group">
          <h4>Слоты башни</h4>
          {#each ['matter', 'word', 'vision'] as slot}
            <label class="discovery-check">
              <input type="checkbox" checked={$discoveryState.towerSlots[slot]}
                on:change={() => handleToggleDiscovery(slot, 'towerSlots')} />
              {SLOT_LABELS[slot]}
            </label>
          {/each}
        </div>

        <div class="discovery-group">
          <h4>Чернильный след (Оззи) — уровень {inkTier}</h4>
          <p class="mark-effect">{INK_TRACE_EFFECTS[inkTier]}</p>
        </div>

        <div class="discovery-group">
          <h4>Метка Наблюдателя (Игрит) — уровень {watcherTier}</h4>
          <p class="mark-effect">{WATCHER_MARK_EFFECTS[watcherTier]}</p>
        </div>

        <div class="discovery-group">
          <h4>Заметки ГМ</h4>
          <textarea bind:value={discoveryNotes} on:blur={handleSaveNotes}
            placeholder="Что партия узнала, кому доверяют, планы..." rows="5"></textarea>
        </div>
      </section>

    {:else if activeTab === 'glitches'}
      <section class="tab-glitches">
        <h3>Глитчи</h3>
        {#if $activeGlitch}
          <p><strong>DC:</strong> +{$activeGlitch.dcModifier}</p>
          {#if $activeGlitch.floodTimeShift !== 0}
            <p><strong>Потоп:</strong> {$activeGlitch.floodTimeShift} мин</p>
          {/if}
          <ul>
            {#each $activeGlitch.descriptions as desc}
              <li>{desc}</li>
            {/each}
          </ul>
        {:else}
          <p>Нет глитчей (циклы 1–6).</p>
        {/if}
      </section>
    {/if}
  </main>
</div>

<style>
  .ink-flood-dashboard { display: flex; flex-direction: column; height: 100%; color: #e0e0e0; font-size: 15px; font-weight: 500; }
  .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #1a1a2e; border-bottom: 1px solid #333; }
  .cycle-info { display: flex; gap: 16px; align-items: center; }
  .cycle-number { font-weight: bold; font-size: 1.1em; }
  .time-display { font-size: 1.3em; font-weight: bold; color: #c0c0ff; }
  .flood-countdown { font-size: 0.9em; color: #aaa; }
  .flood-countdown.urgent { color: #ff6b6b; font-weight: bold; }
  .keys-summary { font-weight: bold; color: #ffd700; }
  .dashboard-tabs { display: flex; background: #16213e; border-bottom: 1px solid #333; }
  .tab-btn { flex: 1; padding: 8px; border: none; background: transparent; color: #888; cursor: pointer; }
  .tab-btn:hover { color: #ccc; background: #1a1a3e; }
  .tab-btn.active { color: #e0e0ff; background: #0f3460; border-bottom: 2px solid #5c7cfa; }
  .dashboard-content { flex: 1; overflow-y: auto; padding: 12px; background: #0a0a1a; }
  h3 { margin: 0 0 12px 0; color: #c0c0ff; font-size: 1em; }
  .time-controls { margin-bottom: 16px; }
  .time-buttons { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .time-buttons button { padding: 6px 12px; background: #16213e; border: 1px solid #333; color: #c0c0ff; border-radius: 4px; cursor: pointer; }
  .time-buttons button:hover { background: #1a1a4e; border-color: #5c7cfa; }
  .custom-time { display: flex; gap: 4px; align-items: center; }
  .custom-time input { width: 50px; padding: 4px; background: #111; border: 1px solid #333; color: #e0e0e0; border-radius: 4px; text-align: center; }
  .btn-new-cycle { padding: 8px 20px; background: #0f3460; border: 1px solid #5c7cfa; color: #e0e0ff; border-radius: 4px; cursor: pointer; font-size: 1em; }
  .btn-new-cycle:hover { background: #1a3a6e; }
  .flood-indicator { padding: 8px; margin-bottom: 12px; border-radius: 4px; text-align: center; font-weight: bold; }
  .flood-indicator.phase-1 { background: #1a1a2e; color: #7c7caa; }
  .flood-indicator.phase-2 { background: #1a1a3e; color: #8888cc; }
  .flood-indicator.phase-3 { background: #2a1a3e; color: #aa77cc; }
  .flood-indicator.phase-4 { background: #3a1a2e; color: #cc5555; }
  .flood-indicator.phase-5 { background: #4a0a0a; color: #ff3333; }
  .glitch-notice { padding: 6px 12px; margin-bottom: 12px; background: #2a1a0a; border: 1px solid #ff8c00; border-radius: 4px; color: #ffaa44; font-weight: bold; }
  .key-slots-overview { display: flex; gap: 8px; }
  .key-slot { flex: 1; padding: 8px; background: #111; border: 1px solid #333; border-radius: 4px; text-align: center; }
  .key-slot.filled { border-color: #ffd700; background: #1a1a0a; }
  .slot-label { display: block; font-size: 0.8em; color: #888; margin-bottom: 4px; }
  .slot-value { font-size: 0.9em; }
  .event-row { display: flex; gap: 8px; align-items: center; padding: 6px 8px; margin-bottom: 4px; border-radius: 4px; background: #111; border: 1px solid #222; }
  .event-row.status-completed { border-color: #2a6a2a; background: #0a1a0a; }
  .event-row.status-missed { border-color: #6a2a2a; background: #1a0a0a; opacity: 0.6; }
  .event-time { font-weight: bold; color: #c0c0ff; min-width: 40px; }
  .event-name { flex: 1; font-size: 0.9em; }
  .event-slot { font-size: 0.8em; color: #888; min-width: 60px; }
  .event-status { font-size: 0.8em; color: #aaa; min-width: 70px; }
  .btn-complete { padding: 3px 8px; background: #1a3a1a; border: 1px solid #2a6a2a; color: #88cc88; border-radius: 3px; cursor: pointer; font-size: 0.8em; }
  .key-detail { padding: 12px; margin-bottom: 8px; background: #111; border: 1px solid #333; border-radius: 4px; }
  .key-detail.filled { border-color: #ffd700; }
  .key-detail h4 { margin: 0 0 4px 0; color: #c0c0ff; }
  .key-name { color: #ffd700; font-weight: bold; }
  .key-empty { color: #666; font-style: italic; }
  .tab-glitches ul { padding-left: 20px; }
  .tab-glitches li { margin-bottom: 4px; color: #ccc; }

  /* Tokens */
  .token-row { display: flex; gap: 8px; align-items: center; padding: 6px 8px; margin-bottom: 4px; background: #111; border: 1px solid #222; border-radius: 4px; }
  .token-name { flex: 1; font-weight: 500; }
  .token-balance { font-weight: bold; color: #ffd700; min-width: 24px; text-align: center; font-size: 1.1em; }
  .token-spent { font-size: 0.8em; color: #888; min-width: 40px; }
  .btn-token { padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8em; border: 1px solid #333; }
  .btn-token.earn { background: #1a3a1a; border-color: #2a6a2a; color: #88cc88; }
  .btn-token.spend { background: #2a1a1a; border-color: #6a3a2a; color: #cc9988; }
  .btn-token.spend2 { background: #2a1a2a; border-color: #6a2a6a; color: #cc88cc; }
  .token-legend { margin-top: 12px; padding: 8px; background: #0a0a1a; border: 1px solid #222; border-radius: 4px; }
  .token-legend p { margin: 2px 0; font-size: 0.85em; color: #aaa; }
  .empty-hint { color: #666; font-style: italic; }

  /* Discoveries */
  .discovery-group { margin-bottom: 16px; }
  .discovery-group h4 { margin: 0 0 6px 0; color: #c0c0ff; font-size: 0.95em; }
  .discovery-check { display: block; padding: 3px 0; cursor: pointer; color: #ccc; }
  .discovery-check input { margin-right: 8px; }
  .mark-effect { font-size: 0.9em; color: #cca; padding: 6px 8px; background: #111; border-radius: 4px; border: 1px solid #333; }
  textarea { width: 100%; padding: 8px; background: #111; border: 1px solid #333; color: #e0e0e0; border-radius: 4px; resize: vertical; font-family: inherit; font-size: 0.9em; }
</style>
