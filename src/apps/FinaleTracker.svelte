<script lang="ts">
  /** Dark Tower Finale Tracker.
   *  State is local (in-memory) — not persisted to Foundry settings.
   *  Tracks the 3-stage ritual: who holds, who rushes, DC modifiers. */

  type Choice = 'hold' | 'rush';

  interface CharState {
    name: string;
    holdStat: string;
    rushStat: string;
    rushEffect: string;
    rushTarget: 'igrit' | 'ozzi';
    choice: Choice;
    failures: number;
    ejected: boolean;
  }

  let stage: 1 | 2 | 3 = 1;
  const baseDC = [14, 15, 16];

  let chars: CharState[] = [
    { name: 'Гатс', holdStat: 'Телосложение', rushStat: 'Атлетика', rushEffect: 'Игрит DC −1', rushTarget: 'igrit', choice: 'hold', failures: 0, ejected: false },
    { name: 'Ллайд', holdStat: 'Ловкость', rushStat: 'Акробатика', rushEffect: 'Оззи преимущество', rushTarget: 'ozzi', choice: 'hold', failures: 0, ejected: false },
    { name: 'Джесс', holdStat: 'Харизма', rushStat: 'Выступление', rushEffect: 'Оззи DC −1', rushTarget: 'ozzi', choice: 'hold', failures: 0, ejected: false },
  ];

  // Accumulated DC modifiers from successful rushes
  let igritDcMod = 0;
  let ozziDcMod = 0;
  let ozziAdvantage = false;

  // Ritual DCs
  $: ozziBaseDC = 16;
  $: igritBaseDC = baseDC[stage - 1];
  $: ozziEffectiveDC = Math.max(1, ozziBaseDC + ozziDcMod);
  $: igritEffectiveDC = Math.max(1, igritBaseDC + igritDcMod);
  $: totalFailures = chars.reduce((s, c) => s + c.failures, 0);
  $: activeChars = chars.filter(c => !c.ejected);

  function getCurrentDC(char: CharState): number {
    let dc = baseDC[stage - 1];
    // Hold failure penalty: +2 for Gats (dragged down), disadvantage for others
    if (char.name === 'Гатс' && char.failures > 0) dc += char.failures * 2;
    return dc;
  }

  function getRushDC(char: CharState): number {
    let dc = baseDC[stage - 1];
    if (char.name === 'Ллайд') dc += 2; // Rush is harder for Llaid
    return dc;
  }

  function resolveSuccess(charIdx: number) {
    const c = chars[charIdx];
    if (c.choice === 'rush') {
      if (c.rushTarget === 'igrit') igritDcMod -= 1;
      else if (c.rushTarget === 'ozzi') {
        if (c.name === 'Ллайд') ozziAdvantage = true;
        else ozziDcMod -= 1;
      }
    }
    chars = chars; // trigger reactivity
  }

  function resolveFailure(charIdx: number) {
    chars[charIdx].failures += 1;
    chars = chars;
  }

  function ejectChar(charIdx: number) {
    chars[charIdx].ejected = true;
    chars = chars;
  }

  function nextStage() {
    if (stage < 3) {
      stage = (stage + 1) as 1 | 2 | 3;
      // Reset choices for next stage
      for (const c of chars) {
        if (!c.ejected) c.choice = 'hold';
      }
      chars = chars;
    }
  }

  function resetFinale() {
    stage = 1;
    igritDcMod = 0;
    ozziDcMod = 0;
    ozziAdvantage = false;
    chars = chars.map(c => ({ ...c, choice: 'hold' as Choice, failures: 0, ejected: false }));
  }
</script>

<div class="finale-tracker">
  <!-- Upper floor: Ritual -->
  <div class="section ritual-section">
    <h3>Этаж 5: Кабинет — Этап {stage}/3</h3>
    <div class="ritual-row">
      <span class="ritual-name">Оззи — Перо</span>
      <span class="ritual-dc">Мудрость DC {ozziEffectiveDC}{ozziAdvantage ? ' (преим.)' : ''}</span>
    </div>
    <div class="ritual-row">
      <span class="ritual-name">Игрит — Якорь</span>
      <span class="ritual-dc">Телосложение DC {igritEffectiveDC}</span>
    </div>
    <div class="stage-dots">
      {#each [1, 2, 3] as s}
        <span class="stage-dot" class:active={stage >= s} class:current={stage === s}>{s}</span>
      {/each}
    </div>
  </div>

  <!-- Lower floors: Holding -->
  <div class="section holding-section">
    <h3>Этажи 2-3: Удержание</h3>
    {#each chars as char, i}
      {#if !char.ejected}
        <div class="char-card">
          <div class="char-header">
            <strong class="char-name">{char.name}</strong>
            <span class="char-failures" class:danger={char.failures >= 2}>Провалов: {char.failures}</span>
          </div>
          <div class="char-choice">
            <label class="choice-label">
              <input type="radio" bind:group={char.choice} value="hold" />
              Удержание ({char.holdStat} DC {getCurrentDC(char)})
            </label>
            <label class="choice-label">
              <input type="radio" bind:group={char.choice} value="rush" />
              Рывок ({char.rushStat} DC {getRushDC(char)}) → {char.rushEffect}
            </label>
          </div>
          <div class="char-actions">
            <button class="btn-success" on:click={() => resolveSuccess(i)}>Успех</button>
            <button class="btn-fail" on:click={() => resolveFailure(i)}>Провал</button>
            {#if totalFailures >= 3}
              <button class="btn-eject" on:click={() => ejectChar(i)}>Выброшен</button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="char-card ejected">
          <strong>{char.name}</strong> — <span class="ejected-label">выброшен из башни</span>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Summary -->
  <div class="section summary-section">
    <div class="summary-row">
      <span>Провалов: <strong class:danger={totalFailures >= 3}>{totalFailures}</strong>/3</span>
      <span>DC бонус Оззи: <strong>{ozziDcMod}</strong></span>
      <span>DC бонус Игрит: <strong>{igritDcMod}</strong></span>
    </div>
    <div class="summary-actions">
      {#if stage < 3}
        <button class="btn-next" on:click={nextStage}>Следующий этап →</button>
      {:else}
        <button class="btn-next final" on:click={() => {}}>Финальный этап!</button>
      {/if}
      <button class="btn-reset" on:click={resetFinale}>Сброс</button>
    </div>
  </div>
</div>

<style>
  .finale-tracker { display: flex; flex-direction: column; height: 100%; color: #e0e0e0; font-size: 16px; font-weight: 600; gap: 0; }

  .section { padding: 12px 14px; }

  .ritual-section { background: #0a0a2a; border-bottom: 1px solid #333; }
  .holding-section { flex: 1; overflow-y: auto; background: #0a0a1a; border-bottom: 1px solid #333; }
  .summary-section { background: #111; }

  h3 { margin: 0 0 10px; color: #c0c0ff; font-size: 1.05em; }

  .ritual-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .ritual-name { color: #e0e0e0; }
  .ritual-dc { color: #ffcc88; font-weight: 700; }

  .stage-dots { display: flex; gap: 8px; margin-top: 8px; justify-content: center; }
  .stage-dot { width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 50%; border: 2px solid #333; color: #666; font-weight: 700; }
  .stage-dot.active { border-color: #5c7cfa; color: #c0c0ff; }
  .stage-dot.current { background: #0f3460; border-color: #5c7cfa; color: #fff; }

  .char-card { margin-bottom: 10px; padding: 10px; background: #111; border: 1px solid #222; border-radius: 4px; }
  .char-card.ejected { opacity: 0.5; padding: 8px 10px; }
  .ejected-label { color: #cc6666; font-style: italic; }

  .char-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .char-name { color: #c0c0ff; }
  .char-failures { font-size: 0.9em; color: #aaa; }
  .char-failures.danger { color: #cc4444; font-weight: 700; }

  .char-choice { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
  .choice-label { font-size: 0.9em; color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .choice-label input { margin: 0; accent-color: #5c7cfa; }

  .char-actions { display: flex; gap: 6px; }

  .btn-success { padding: 4px 12px; background: #1a3a1a; border: 1px solid #2a6a2a; color: #88cc88; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 0.85em; }
  .btn-fail { padding: 4px 12px; background: #2a1a1a; border: 1px solid #6a2a2a; color: #cc8888; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 0.85em; }
  .btn-eject { padding: 4px 12px; background: #2a0a0a; border: 1px solid #aa2222; color: #ff6666; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 0.85em; }

  .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95em; }
  .summary-row strong { color: #ffd700; }
  .summary-row .danger { color: #cc4444; }

  .summary-actions { display: flex; gap: 8px; }
  .btn-next { flex: 1; padding: 10px; background: #0f3460; border: 1px solid #5c7cfa; color: #e0e0ff; border-radius: 4px; cursor: pointer; font-weight: 700; font-size: 1em; }
  .btn-next:hover { background: #1a3a6e; }
  .btn-next.final { border-color: #ffd700; color: #ffd700; }
  .btn-reset { padding: 10px; background: #1a1a1a; border: 1px solid #333; color: #888; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
</style>
