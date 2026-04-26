<script lang="ts">
  /** Dark Tower Finale Tracker.
   *  State is local (in-memory) — not persisted to Foundry settings.
   *  Tracks the parallel finale:
   *    Upstairs (5th floor): Ozzi writes (Wis save) + Igrit anchors (Con save) — 3 stages.
   *    Downstairs (4th floor library): 3-wave combat against ink manifestations.
   *  Each defeated wave = -1 to ritual DC for the next stage.
   *  Each missed wave = +1 to ritual DC + ink leaks upstairs.
   */

  type WaveStatus = 'pending' | 'active' | 'defeated' | 'leaked';

  interface Wave {
    stage: 1 | 2 | 3;
    label: string;
    composition: string;
    notes: string;
    status: WaveStatus;
  }

  let stage: 1 | 2 | 3 = 1;
  const baseIgritDC = [14, 15, 16];
  const ozziBaseDC = 16;

  let waves: Wave[] = [
    {
      stage: 1,
      label: 'Волна 1',
      composition: '4 Чернильных Силуэта',
      notes: 'Поднимаются между полками. Гатс держит проход — Возможность Атаки на проходящих.',
      status: 'active',
    },
    {
      stage: 2,
      label: 'Волна 2',
      composition: '1 Хор + 2 Силуэта',
      notes: 'Хор шепчет голосами Эльзы / Келя. Джесс: Выступление DC 14 затыкает Хор на раунд.',
      status: 'pending',
    },
    {
      stage: 3,
      label: 'Волна 3',
      composition: '1-2 Оттиска + 1-2 Силуэта',
      notes: 'Оттиски используют абилки прообразов. Эмоциональный удар — выбирай по тому, чья смерть ударила сильнее.',
      status: 'pending',
    },
  ];

  // Accumulated ritual modifiers from wave outcomes
  let ozziDcMod = 0;
  let igritDcMod = 0;

  // Effective DCs (computed)
  $: ozziEffectiveDC = Math.max(1, ozziBaseDC + ozziDcMod);
  $: igritEffectiveDC = Math.max(1, baseIgritDC[stage - 1] + igritDcMod);

  // Counts
  $: defeatedCount = waves.filter(w => w.status === 'defeated').length;
  $: leakedCount = waves.filter(w => w.status === 'leaked').length;

  function markDefeated(idx: number) {
    waves[idx].status = 'defeated';
    ozziDcMod -= 1;
    igritDcMod -= 1;
    waves = waves;
  }

  function markLeaked(idx: number) {
    waves[idx].status = 'leaked';
    ozziDcMod += 1;
    igritDcMod += 1;
    waves = waves;
  }

  function nextStage() {
    if (stage < 3) {
      stage = (stage + 1) as 1 | 2 | 3;
      // Advance the next pending wave to active
      const nextIdx = waves.findIndex(w => w.status === 'pending');
      if (nextIdx !== -1) waves[nextIdx].status = 'active';
      waves = waves;
    }
  }

  function resetFinale() {
    stage = 1;
    ozziDcMod = 0;
    igritDcMod = 0;
    waves = waves.map((w, i) => ({ ...w, status: i === 0 ? 'active' : 'pending' }));
  }
</script>

<div class="finale-tracker">
  <!-- Upper floor: Ritual -->
  <div class="section ritual-section">
    <h3>Этаж 5: Кабинет — Этап {stage}/3</h3>
    <div class="ritual-row">
      <span class="ritual-name">Оззи — Перо</span>
      <span class="ritual-dc">Мудрость DC {ozziEffectiveDC}</span>
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

  <!-- Lower floor: Library combat -->
  <div class="section combat-section">
    <h3>Этаж 4: Библиотека — Бой</h3>
    {#each waves as wave, i}
      <div class="wave-card" class:wave-active={wave.status === 'active'} class:wave-defeated={wave.status === 'defeated'} class:wave-leaked={wave.status === 'leaked'}>
        <div class="wave-header">
          <strong class="wave-label">{wave.label} <span class="wave-stage">(этап {wave.stage})</span></strong>
          <span class="wave-status">
            {#if wave.status === 'pending'}⏳ ожидает
            {:else if wave.status === 'active'}⚔ активна
            {:else if wave.status === 'defeated'}✅ разбита
            {:else}☠ прорвалась{/if}
          </span>
        </div>
        <div class="wave-composition">{wave.composition}</div>
        <div class="wave-notes">{wave.notes}</div>
        {#if wave.status === 'active'}
          <div class="wave-actions">
            <button class="btn-defeat" on:click={() => markDefeated(i)}>Разбита (−1 DC ритуала)</button>
            <button class="btn-leak" on:click={() => markLeaked(i)}>Прорвалась (+1 DC ритуала)</button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Summary -->
  <div class="section summary-section">
    <div class="summary-row">
      <span>Разбито: <strong>{defeatedCount}</strong>/3</span>
      <span>Прорвалось: <strong class:danger={leakedCount > 0}>{leakedCount}</strong>/3</span>
      <span>DC бонус Оззи: <strong class:bonus={ozziDcMod < 0} class:penalty={ozziDcMod > 0}>{ozziDcMod >= 0 ? '+' : ''}{ozziDcMod}</strong></span>
      <span>DC бонус Игрит: <strong class:bonus={igritDcMod < 0} class:penalty={igritDcMod > 0}>{igritDcMod >= 0 ? '+' : ''}{igritDcMod}</strong></span>
    </div>
    <div class="summary-actions">
      {#if stage < 3}
        <button class="btn-next" on:click={nextStage}>Следующий этап →</button>
      {:else}
        <button class="btn-next final" disabled>Финальный этап</button>
      {/if}
      <button class="btn-reset" on:click={resetFinale}>Сброс</button>
    </div>
  </div>
</div>

<style>
  .finale-tracker { display: flex; flex-direction: column; height: 100%; color: #e0e0e0; font-size: 16px; font-weight: 600; gap: 0; }

  .section { padding: 12px 14px; }

  .ritual-section { background: #0a0a2a; border-bottom: 1px solid #333; }
  .combat-section { flex: 1; overflow-y: auto; background: #0a0a1a; border-bottom: 1px solid #333; }
  .summary-section { background: #111; }

  h3 { margin: 0 0 10px; color: #c0c0ff; font-size: 1.05em; }

  .ritual-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .ritual-name { color: #e0e0e0; }
  .ritual-dc { color: #ffcc88; font-weight: 700; }

  .stage-dots { display: flex; gap: 8px; margin-top: 8px; justify-content: center; }
  .stage-dot { width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 50%; border: 2px solid #333; color: #666; font-weight: 700; }
  .stage-dot.active { border-color: #5c7cfa; color: #c0c0ff; }
  .stage-dot.current { background: #0f3460; border-color: #5c7cfa; color: #fff; }

  .wave-card { margin-bottom: 10px; padding: 10px; background: #111; border: 1px solid #222; border-radius: 4px; }
  .wave-card.wave-active { border-color: #5c7cfa; box-shadow: 0 0 8px rgba(92, 124, 250, 0.3); }
  .wave-card.wave-defeated { opacity: 0.6; border-color: #2a6a2a; }
  .wave-card.wave-leaked { opacity: 0.6; border-color: #aa2222; }

  .wave-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .wave-label { color: #c0c0ff; }
  .wave-stage { color: #888; font-weight: 400; font-size: 0.85em; }
  .wave-status { font-size: 0.9em; color: #aaa; }

  .wave-composition { color: #ffcc88; font-size: 0.95em; margin-bottom: 4px; }
  .wave-notes { color: #aab; font-size: 0.85em; font-weight: 400; line-height: 1.4; margin-bottom: 8px; font-style: italic; }

  .wave-actions { display: flex; gap: 6px; }

  .btn-defeat { flex: 1; padding: 5px 10px; background: #1a3a1a; border: 1px solid #2a6a2a; color: #88cc88; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 0.85em; }
  .btn-leak { flex: 1; padding: 5px 10px; background: #2a1a1a; border: 1px solid #6a2a2a; color: #cc8888; border-radius: 3px; cursor: pointer; font-weight: 600; font-size: 0.85em; }

  .summary-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; font-size: 0.95em; }
  .summary-row strong { color: #ffd700; }
  .summary-row .bonus { color: #88cc88; }
  .summary-row .penalty { color: #cc4444; }
  .summary-row .danger { color: #cc4444; }

  .summary-actions { display: flex; gap: 8px; }
  .btn-next { flex: 1; padding: 10px; background: #0f3460; border: 1px solid #5c7cfa; color: #e0e0ff; border-radius: 4px; cursor: pointer; font-weight: 700; font-size: 1em; }
  .btn-next:hover:not(:disabled) { background: #1a3a6e; }
  .btn-next.final { border-color: #ffd700; color: #ffd700; opacity: 0.6; cursor: default; }
  .btn-reset { padding: 10px; background: #1a1a1a; border: 1px solid #333; color: #888; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
</style>
