import { SvelteApplicationMixin } from '../../mixins/SvelteApplicationMixin.svelte';
import FinaleTracker from '../FinaleTracker.svelte';

const { ApplicationV2 } = foundry.applications.api;

export class FinaleShell extends SvelteApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'ink-flood-finale',
    classes: ['ink-flood', 'finale'],
    window: {
      title: 'Тёмная башня — Финал',
      resizable: true,
    },
    position: {
      width: 420,
      height: 560,
    },
  };

  get svelteComponent() {
    return FinaleTracker;
  }
}
