<script lang="ts">
  import { cycleState, formattedTime, minutesUntilFlood } from '../stores';
  import { MAX_CYCLES } from '../constants';

  $: floodPhase = $cycleState.floodPhase;
  $: isUrgent = $minutesUntilFlood <= 60;
  $: isFloodActive = floodPhase > 0;
</script>

<div class="ink-flood-clock">
  <div class="clock-cycle">Цикл {$cycleState.cycle}/{MAX_CYCLES}</div>
  <div class="clock-time">{$formattedTime}</div>
  <div class="clock-flood" class:urgent={isUrgent} class:flooding={isFloodActive}>
    {#if isFloodActive}
      Потоп {floodPhase}/5
    {:else}
      До потопа: {$minutesUntilFlood} мин
    {/if}
  </div>
</div>

<style>
  .ink-flood-clock { display: flex; flex-direction: column; align-items: center; padding: 8px 16px; color: #e0e0e0; min-width: 140px; }
  .clock-cycle { font-size: 0.8em; color: #888; margin-bottom: 2px; }
  .clock-time { font-size: 1.8em; font-weight: bold; color: #c0c0ff; letter-spacing: 2px; }
  .clock-flood { font-size: 0.85em; color: #aaa; margin-top: 2px; }
  .clock-flood.urgent { color: #ff8c00; font-weight: bold; }
  .clock-flood.flooding { color: #ff3333; font-weight: bold; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
</style>
