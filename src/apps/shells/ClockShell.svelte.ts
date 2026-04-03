import { SvelteApplicationMixin } from '../../mixins/SvelteApplicationMixin.svelte';
import ClockDisplay from '../ClockDisplay.svelte';

const { ApplicationV2 } = foundry.applications.api;

export class ClockShell extends SvelteApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'ink-flood-clock',
    classes: ['ink-flood', 'clock'],
    window: {
      title: 'Часы',
      resizable: false,
      minimizable: false,
    },
    position: {
      width: 180,
    },
  };

  get svelteComponent() {
    return ClockDisplay;
  }
}
