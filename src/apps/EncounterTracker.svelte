<script lang="ts">
  import {
    cycleState,
    encounterState,
    recommendedEncounters,
    availableEchoes,
    currentCycleLog,
  } from '../stores';
  import {
    setNpcStatus,
    resetNpcStatusToAuto,
    recordEncounter,
  } from '../engine/encounter-engine';
  import { ENCOUNTER_BY_ID, NPC_IDS, NPC_NAMES_RU } from '../data/encounters';
  import { formatTime } from '../engine/clock-engine';
  import { MODULE_ID } from '../constants';
  import type { NpcId, NpcStatus } from '../types';

  function persist(state: typeof $encounterState) {
    encounterState.set(state);
    void (game as any).settings.set(MODULE_ID, 'encounterState', state);
    (game as any).socket?.emit(`module.${MODULE_ID}`, { type: 'encounter-update' });
  }

  function onChangeStatus(npcId: NpcId, status: NpcStatus) {
    persist(setNpcStatus($encounterState, npcId, status, $cycleState.cycle));
  }

  function onResetToAuto(npcId: NpcId) {
    persist(resetNpcStatusToAuto($encounterState, npcId));
  }

  function onLog(encounterId: string, location?: string) {
    persist(recordEncounter($encounterState, $cycleState.cycle, $cycleState.currentTime, encounterId, location));
  }

  $: deadCount = NPC_IDS.filter((id) => $encounterState.npcStatus[id]?.status === 'dead').length;
</script>

<div class="encounter-tracker">
  <header class="head">
    <h2>Энкаунтеры</h2>
    <span class="cycle-badge">Цикл {$cycleState.cycle} · {formatTime($cycleState.currentTime)}</span>
  </header>

  <section>
    <h3>Сейчас рекомендовано</h3>
    {#if $recommendedEncounters.length === 0}
      <p class="empty">Нет рекомендаций для текущего цикла/времени.</p>
    {:else}
      <div class="cards">
        {#each $recommendedEncounters as enc (enc.id)}
          {@const window = enc.spawnWindows.find(
            (w) => $cycleState.cycle >= w.cycleMin
              && $cycleState.currentTime >= w.timeRange[0]
              && $cycleState.currentTime <= w.timeRange[1]
          )}
          <div class="card type-{enc.type}">
            <img class="portrait" src={enc.portrait} alt={enc.nameRu} />
            <div class="body">
              <div class="title">
                <strong>{enc.nameRu}</strong>
                <span class="en">{enc.name}</span>
              </div>
              {#if window}
                <div class="meta">
                  {formatTime(window.timeRange[0])}–{formatTime(window.timeRange[1])}
                  {#if window.location}· {window.location}{/if}
                </div>
                <div class="note">{window.note}</div>
              {/if}
              <button class="log-btn" on:click={() => onLog(enc.id, window?.location)}>
                Записать в журнал
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section>
    <h3>Статус НИП ({deadCount} мертво)</h3>
    <div class="npc-grid">
      {#each NPC_IDS as id}
        {@const entry = $encounterState.npcStatus[id]}
        <div class="npc-row">
          <span class="npc-name">{NPC_NAMES_RU[id]}</span>
          <select
            value={entry?.status ?? 'alive'}
            on:change={(e) => onChangeStatus(id, (e.target as HTMLSelectElement).value as NpcStatus)}
          >
            <option value="alive">жив</option>
            <option value="dead">мёртв</option>
            <option value="unknown">неизв.</option>
          </select>
          <span class="src src-{entry?.source ?? 'auto'}" title={entry?.source === 'auto' ? 'Выведено из событий' : 'ГМ'}>
            {entry?.source === 'auto' ? 'auto' : 'manual'}
          </span>
          {#if entry?.source === 'manual'}
            <button class="reset-btn" on:click={() => onResetToAuto(id)} title="Сбросить в авто">↺</button>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h3>Доступные Оттиски</h3>
    {#if $availableEchoes.length === 0}
      <p class="empty">Нет погибших НИП — Оттиски не манифестируются.</p>
    {:else}
      <ul class="echo-list">
        {#each $availableEchoes as echo (echo.id)}
          <li>
            <strong>{echo.nameRu}</strong>
            {#if echo.defaultLocation}<span class="loc">· {echo.defaultLocation}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h3>Журнал цикла</h3>
    {#if $currentCycleLog.length === 0}
      <p class="empty">Пока ничего не разыграно.</p>
    {:else}
      <ul class="log-list">
        {#each $currentCycleLog as entry, i (i)}
          {@const def = ENCOUNTER_BY_ID[entry.encounterId]}
          <li>
            <span class="log-time">{formatTime(entry.time)}</span>
            <span>{def?.nameRu ?? entry.encounterId}</span>
            {#if entry.location}<span class="loc">· {entry.location}</span>{/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .encounter-tracker {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #e0e0e0;
    background: #0a0a1a;
    padding: 12px;
    overflow-y: auto;
    font-size: 14px;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
  }

  .head h2 {
    margin: 0;
    color: #c0c0ff;
    font-size: 1.2em;
  }

  .cycle-badge {
    font-size: 0.85em;
    color: #999;
    font-family: monospace;
  }

  section {
    margin-bottom: 16px;
  }

  section h3 {
    margin: 0 0 8px;
    color: #c0c0ff;
    font-size: 0.95em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .empty {
    margin: 0;
    color: #666;
    font-style: italic;
    font-size: 0.9em;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card {
    display: flex;
    gap: 10px;
    padding: 8px;
    background: #14142a;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
  }

  .card.type-chorus {
    border-color: #4a2a4a;
  }

  .card.type-echo {
    border-color: #4a3a2a;
  }

  .portrait {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 4px;
    flex-shrink: 0;
    background: #000;
  }

  .body {
    flex: 1;
    min-width: 0;
  }

  .title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }

  .title strong {
    color: #e0e0e0;
  }

  .en {
    font-size: 0.8em;
    color: #666;
    font-family: monospace;
  }

  .meta {
    font-size: 0.85em;
    color: #aaa;
    font-family: monospace;
    margin-bottom: 4px;
  }

  .note {
    font-size: 0.9em;
    color: #ccc;
    line-height: 1.3;
    margin-bottom: 6px;
  }

  .log-btn {
    background: #1a1a3a;
    border: 1px solid #3a3a5a;
    color: #c0c0ff;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 0.85em;
    cursor: pointer;
  }

  .log-btn:hover {
    background: #2a2a4a;
  }

  .npc-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .npc-row {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 8px;
    align-items: center;
    font-size: 0.9em;
  }

  .npc-name {
    color: #ccc;
  }

  .npc-row select {
    background: #14142a;
    color: #e0e0e0;
    border: 1px solid #3a3a5a;
    padding: 2px 4px;
    font-size: 0.9em;
    border-radius: 3px;
  }

  .src {
    font-size: 0.7em;
    font-family: monospace;
    padding: 1px 4px;
    border-radius: 3px;
    color: #888;
  }

  .src-manual {
    background: #2a1a1a;
    color: #d4a888;
  }

  .src-auto {
    background: #1a2a1a;
    color: #88c488;
  }

  .reset-btn {
    background: transparent;
    border: 1px solid #3a3a5a;
    color: #888;
    padding: 0 6px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.9em;
  }

  .reset-btn:hover {
    color: #c0c0ff;
    border-color: #c0c0ff;
  }

  .echo-list, .log-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.9em;
  }

  .echo-list li, .log-list li {
    margin-bottom: 3px;
    color: #ccc;
  }

  .log-time {
    font-family: monospace;
    color: #888;
    margin-right: 6px;
  }

  .loc {
    color: #888;
    font-size: 0.9em;
  }
</style>
