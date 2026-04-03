<script lang="ts">
  import { cycleState, formattedTime, minutesUntilFlood, activeGlitch, syncFromSettings } from '../stores';
  import { advanceTime, completeEvent } from '../engine/clock-engine';
  import { startNewCycle, initializeFirstCycle } from '../engine/cycle-engine';
  import { getEvent, formatTime } from '../data/events';
  import { MAX_CYCLES } from '../constants';
  import type { EventId } from '../types';

  let activeTab = 'overview';
  let customMinutes = 30;

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'events', label: 'События' },
    { id: 'keys', label: 'Ключи' },
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

  $: availableEvents = $cycleState.events.filter(e => e.status !== 'unavailable');
  $: collectedCount = [$cycleState.keys.matter, $cycleState.keys.word, $cycleState.keys.vision].filter(Boolean).length;
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
  .ink-flood-dashboard { display: flex; flex-direction: column; height: 100%; color: #e0e0e0; }
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
</style>
