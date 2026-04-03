import { SvelteApplication } from '#runtime/svelte/application';
import ClockDisplay from '../ClockDisplay.svelte';

export class ClockShell extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'ink-flood-clock',
      title: 'Часы',
      width: 180,
      height: 'auto',
      resizable: false,
      minimizable: false,
      popOut: true,
      svelte: {
        class: ClockDisplay,
        target: document.body,
      },
    });
  }
}
