<script lang="ts">
  import type { NpcCard } from '../data/npc-cards';

  export let card: NpcCard | null = null;
  export let x: number = 0;
  export let y: number = 0;
  export let onClose: () => void = () => {};

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('npc-popup-backdrop')) {
      onClose();
    }
  }
</script>

{#if card}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="npc-popup-backdrop" on:click={handleBackdropClick}>
    <div class="npc-popup" style="top: {y}px; left: {x}px;">
      <div class="npc-popup-header">
        <strong class="npc-popup-name">{card.name}</strong>
        <button class="npc-popup-close" on:click={onClose}>✕</button>
      </div>
      <p class="npc-popup-short">{card.shortDescription}</p>
      <div class="npc-popup-section">
        <span class="npc-popup-label">Внешность:</span>
        <span>{card.appearance}</span>
      </div>
      <div class="npc-popup-section">
        <span class="npc-popup-label">Характер:</span>
        <span>{card.personality}</span>
      </div>
      <div class="npc-popup-quotes">
        {#each card.quotes as quote}
          <p class="npc-popup-quote">{quote}</p>
        {/each}
      </div>
      <div class="npc-popup-stats">{card.stats}</div>
    </div>
  </div>
{/if}

<style>
  .npc-popup-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1000;
  }

  .npc-popup {
    position: absolute;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    background: #0f0f1e;
    border: 1px solid #5c7cfa;
    border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    padding: 12px;
    color: #e0e0e0;
    font-size: 0.9em;
    z-index: 1001;
  }

  .npc-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    border-bottom: 1px solid #333;
    padding-bottom: 6px;
  }

  .npc-popup-name { color: #c0c0ff; font-size: 1.15em; }

  .npc-popup-close {
    padding: 2px 8px;
    background: #2a1a1a;
    border: 1px solid #6a2a2a;
    color: #cc6666;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.85em;
  }

  .npc-popup-short {
    margin: 0 0 8px;
    font-style: italic;
    color: #aab;
    font-size: 0.95em;
  }

  .npc-popup-section {
    margin-bottom: 6px;
    line-height: 1.4;
    color: #ccc;
  }

  .npc-popup-label {
    font-weight: 700;
    color: #c0c0ff;
    margin-right: 4px;
  }

  .npc-popup-quotes {
    margin: 8px 0;
    padding: 6px 10px;
    background: #111;
    border-left: 3px solid #5c7cfa;
    border-radius: 2px;
  }

  .npc-popup-quote {
    margin: 3px 0;
    font-style: italic;
    color: #aab;
    font-size: 0.95em;
  }

  .npc-popup-stats {
    margin-top: 8px;
    padding: 6px 8px;
    background: #1a1a0a;
    border: 1px solid #4a4a2a;
    border-radius: 3px;
    color: #cccc88;
    font-size: 0.9em;
    font-weight: 600;
  }
</style>
