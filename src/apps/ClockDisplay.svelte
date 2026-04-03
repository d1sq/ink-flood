<script lang="ts">
  import { formattedTime } from '../stores';
</script>

<div class="ink-flood-clock">
  <div class="clock-time">{$formattedTime}</div>
</div>

<style>
  .ink-flood-clock { display: flex; align-items: center; justify-content: center; padding: 10px 20px; color: #e0e0e0; }
  .clock-time { font-size: 2.2em; font-weight: 800; color: #c0c0ff; letter-spacing: 2px; }
</style>
