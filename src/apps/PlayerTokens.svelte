<script lang="ts">
  import { cycleState, syncFromSettings } from '../stores';
  import { getTokens, getSpentThisCycle } from '../engine/insight-engine';
  import { MODULE_ID, MAX_INSIGHT_PER_CYCLE } from '../constants';

  let myTokens = 0;
  let mySpent = 0;
  let myName = '';

  function refresh() {
    const actor = getMyActor();
    if (actor) {
      myTokens = getTokens(actor);
      mySpent = getSpentThisCycle(actor);
      myName = actor.name;
    }
  }

  function getMyActor(): any {
    const userId = (game as any).user?.id;
    if (!userId) return null;
    return (game as any).actors?.find((a: any) =>
      a.hasPlayerOwner && a.ownership?.[userId] === 3
    ) ?? null;
  }

  // Refresh on store change and on mount
  $: if ($cycleState) refresh();

  // Listen for socket updates
  const socketHandler = () => { syncFromSettings(); refresh(); };
  (game as any).socket?.on(`module.${MODULE_ID}`, socketHandler);
</script>

<div class="player-tokens">
  <div class="token-header">
    <span class="token-title">Токены Прозрения</span>
    {#if myName}
      <span class="token-actor">{myName}</span>
    {/if}
  </div>

  <div class="token-balance-block">
    <span class="token-balance-number">{myTokens}</span>
    <span class="token-balance-label">доступно</span>
  </div>

  <div class="token-spent-block">
    <span class="token-spent-label">Потрачено в этом цикле:</span>
    <span class="token-spent-value">{mySpent} / {MAX_INSIGHT_PER_CYCLE}</span>
  </div>

  <div class="token-divider"></div>

  <div class="token-legend">
    <h3>Что можно сделать</h3>
    <div class="legend-item">
      <span class="legend-cost">1</span>
      <span class="legend-text"><strong>Преимущество</strong> на проверку, связанную с ключом, который уже пытались добыть</span>
    </div>
    <div class="legend-item">
      <span class="legend-cost">1</span>
      <span class="legend-text"><strong>DC −2</strong> для одной проверки</span>
    </div>
    <div class="legend-item">
      <span class="legend-cost">2</span>
      <span class="legend-text"><strong>Вопрос ГМу</strong> «да/нет» про тайминг или расположение</span>
    </div>
  </div>

  <div class="token-divider"></div>

  <div class="token-how">
    <h3>Как получить</h3>
    <p>За каждый ключ, к которому <strong>подступились</strong> (попытка, даже неудачная) — <strong>+1 токен</strong> в конце цикла.</p>
    <p class="token-note">«Подступиться» = прийти и предпринять действие. Просто посмотреть не считается.</p>
  </div>
</div>

<style>
  .player-tokens {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #e0e0e0;
    font-size: 15px;
    font-weight: 500;
    padding: 14px;
    background: #0a0a1a;
  }

  .token-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .token-title {
    font-size: 1.15em;
    font-weight: 700;
    color: #c0c0ff;
  }

  .token-actor {
    font-size: 0.9em;
    color: #888;
  }

  .token-balance-block {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
  }

  .token-balance-number {
    font-size: 3em;
    font-weight: 800;
    color: #ffd700;
    line-height: 1;
  }

  .token-balance-label {
    font-size: 1.1em;
    color: #aaa;
    font-weight: 600;
  }

  .token-spent-block {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  }

  .token-spent-label {
    color: #888;
    font-size: 0.9em;
  }

  .token-spent-value {
    color: #ccaa88;
    font-weight: 700;
    font-size: 0.95em;
  }

  .token-divider {
    height: 1px;
    background: #222;
    margin: 12px 0;
  }

  .token-legend h3, .token-how h3 {
    margin: 0 0 10px;
    color: #c0c0ff;
    font-size: 1em;
    font-weight: 700;
  }

  .legend-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .legend-cost {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    background: #1a1a0a;
    border: 1px solid #4a4a2a;
    border-radius: 50%;
    color: #ffd700;
    font-weight: 700;
    font-size: 0.95em;
    flex-shrink: 0;
  }

  .legend-text {
    color: #ccc;
    line-height: 1.4;
    font-size: 0.95em;
  }

  .legend-text strong {
    color: #e0e0e0;
  }

  .token-how p {
    margin: 0 0 6px;
    color: #ccc;
    line-height: 1.4;
    font-size: 0.95em;
  }

  .token-how strong {
    color: #ffd700;
  }

  .token-note {
    font-style: italic;
    color: #888;
    font-size: 0.9em;
  }
</style>
