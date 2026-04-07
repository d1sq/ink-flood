<script lang="ts">
  import type { NpcCard } from '../data/npc-cards';
  import { onMount, onDestroy } from 'svelte';

  export let card: NpcCard | null = null;
  export let x: number = 0;
  export let y: number = 0;
  export let onClose: () => void = () => {};

  const POPUP_WIDTH = 380;
  const POPUP_HEIGHT = 440;

  let portalEl: HTMLDivElement | null = null;

  onMount(() => {
    portalEl = document.createElement('div');
    portalEl.className = 'ink-flood-npc-portal';
    document.body.appendChild(portalEl);
  });

  onDestroy(() => {
    portalEl?.remove();
  });

  $: popupX = Math.min(x, window.innerWidth - POPUP_WIDTH - 16);
  $: popupY = (y + POPUP_HEIGHT > window.innerHeight - 16) ? Math.max(16, y - POPUP_HEIGHT) : y;

  // Portal: render into body-level element
  $: if (portalEl) {
    if (card) {
      portalEl.innerHTML = '';
      const backdrop = document.createElement('div');
      backdrop.className = 'npc-popup-backdrop';
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) onClose();
      });

      const popup = document.createElement('div');
      popup.className = 'npc-popup';
      popup.style.left = `${popupX}px`;
      popup.style.top = `${popupY}px`;

      popup.innerHTML = `
        <div class="npc-popup-header">
          <strong class="npc-popup-name">${card.name}</strong>
          <button class="npc-popup-close">✕</button>
        </div>
        <p class="npc-popup-short">${card.shortDescription}</p>
        <div class="npc-popup-section">
          <span class="npc-popup-label">Внешность:</span>
          <span>${card.appearance}</span>
        </div>
        <div class="npc-popup-section">
          <span class="npc-popup-label">Характер:</span>
          <span>${card.personality}</span>
        </div>
        <div class="npc-popup-quotes">
          ${card.quotes.map(q => `<p class="npc-popup-quote">${q}</p>`).join('')}
        </div>
        <div class="npc-popup-stats">${card.stats}</div>
      `;

      popup.querySelector('.npc-popup-close')?.addEventListener('click', onClose);

      // Dragging via header
      const header = popup.querySelector('.npc-popup-header') as HTMLElement;
      if (header) {
        header.style.cursor = 'grab';
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        header.addEventListener('mousedown', (e: MouseEvent) => {
          if ((e.target as HTMLElement).classList.contains('npc-popup-close')) return;
          dragging = true;
          offsetX = e.clientX - popup.offsetLeft;
          offsetY = e.clientY - popup.offsetTop;
          header.style.cursor = 'grabbing';
          e.preventDefault();
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
          if (!dragging) return;
          popup.style.left = `${e.clientX - offsetX}px`;
          popup.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
          if (dragging) {
            dragging = false;
            header.style.cursor = 'grab';
          }
        });
      }

      backdrop.appendChild(popup);
      portalEl.appendChild(backdrop);
    } else {
      portalEl.innerHTML = '';
    }
  }
</script>

<svelte:head>
  <style>
    .npc-popup-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 10000;
    }

    .npc-popup {
      position: fixed;
      width: 380px;
      max-height: 500px;
      overflow-y: auto;
      background: #0f0f1e;
      border: 1px solid #5c7cfa;
      border-radius: 6px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.8);
      padding: 14px;
      color: #e0e0e0;
      font-size: 16px;
      font-weight: 500;
      z-index: 10001;
    }

    .npc-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 1px solid #333;
      padding-bottom: 8px;
      user-select: none;
    }

    .npc-popup-name { color: #c0c0ff; font-size: 1.2em; font-weight: 700; }

    .npc-popup-close {
      padding: 3px 10px;
      background: #2a1a1a;
      border: 1px solid #6a2a2a;
      color: #cc6666;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.9em;
    }
    .npc-popup-close:hover { background: #3a2a2a; }

    .npc-popup-short {
      margin: 0 0 10px;
      font-style: italic;
      color: #aab;
    }

    .npc-popup-section {
      margin-bottom: 8px;
      line-height: 1.5;
      color: #ccc;
    }

    .npc-popup-label {
      font-weight: 700;
      color: #c0c0ff;
      margin-right: 4px;
    }

    .npc-popup-quotes {
      margin: 10px 0;
      padding: 8px 12px;
      background: #111;
      border-left: 3px solid #5c7cfa;
      border-radius: 2px;
    }

    .npc-popup-quote {
      margin: 4px 0;
      font-style: italic;
      color: #aab;
    }

    .npc-popup-stats {
      margin-top: 10px;
      padding: 8px 10px;
      background: #1a1a0a;
      border: 1px solid #4a4a2a;
      border-radius: 3px;
      color: #cccc88;
      font-weight: 600;
    }
  </style>
</svelte:head>
