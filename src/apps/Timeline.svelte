<script lang="ts">
  import type { EventState, EventId } from '../types';
  import { getEvent, formatTime } from '../data/events';
  import { getFloodTimes } from '../engine/clock-engine';
  import { DAY_START } from '../constants';

  export let events: EventState[] = [];
  export let currentTime: number = DAY_START;
  export let cycle: number = 1;
  export let onEventClick: (id: EventId) => void = () => {};

  const SLOT_COLORS: Record<string, string> = {
    matter: '#cc4444',
    word: '#ccaa33',
    vision: '#44aa44',
  };

  $: floodStart = getFloodTimes(cycle)[0];
  $: totalSpan = floodStart - DAY_START;
  $: timePosition = Math.min(100, Math.max(0, ((currentTime - DAY_START) / totalSpan) * 100));

  $: visibleEvents = events
    .filter(e => e.status !== 'unavailable')
    .map(e => {
      const def = getEvent(e.id);
      const left = ((e.actualTime - DAY_START) / totalSpan) * 100;
      return { ...e, def, left: Math.min(100, Math.max(0, left)), color: SLOT_COLORS[def.slot] ?? '#888' };
    });

  function statusShape(status: string): string {
    if (status === 'completed') return '●';
    if (status === 'missed') return '✕';
    return '○';
  }
</script>

<div class="timeline-container">
  <!-- Track -->
  <div class="timeline-track">
    <!-- Flood zone -->
    <div class="flood-zone" style="left: 100%; width: 0;"></div>

    <!-- Time indicator -->
    <div class="time-needle" style="left: {timePosition}%">
      <span class="time-label">{formatTime(currentTime)}</span>
    </div>

    <!-- Event markers -->
    {#each visibleEvents as ev}
      <button
        class="event-marker status-{ev.status}"
        style="left: {ev.left}%; color: {ev.color}; border-color: {ev.color};"
        title="{formatTime(ev.actualTime)} — {ev.def.shortDescription}"
        on:click={() => onEventClick(ev.id)}
      >
        {statusShape(ev.status)}
      </button>
    {/each}
  </div>

  <!-- Time labels -->
  <div class="timeline-labels">
    <span class="label-start">08:00</span>
    <span class="label-end">{formatTime(floodStart)}</span>
  </div>
</div>

<style>
  .timeline-container { margin-bottom: 14px; user-select: none; }

  .timeline-track {
    position: relative;
    height: 32px;
    background: linear-gradient(90deg, #111 0%, #111 85%, #2a0a0a 100%);
    border: 1px solid #333;
    border-radius: 4px;
    overflow: visible;
  }

  .time-needle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #5c7cfa;
    transform: translateX(-1px);
    z-index: 2;
  }

  .time-label {
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7em;
    color: #5c7cfa;
    font-weight: 700;
    white-space: nowrap;
  }

  .event-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid;
    background: #0a0a1a;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    cursor: pointer;
    z-index: 1;
    padding: 0;
    font-weight: 700;
    transition: transform 0.1s;
  }

  .event-marker:hover {
    transform: translate(-50%, -50%) scale(1.3);
    z-index: 3;
  }

  .event-marker.status-completed {
    background: color-mix(in srgb, currentColor 20%, #0a0a1a);
  }

  .event-marker.status-missed {
    opacity: 0.4;
  }

  .timeline-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7em;
    color: #666;
    margin-top: 2px;
    font-weight: 600;
  }
</style>
