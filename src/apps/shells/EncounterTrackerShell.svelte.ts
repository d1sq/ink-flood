import { SvelteApplicationMixin } from '../../mixins/SvelteApplicationMixin.svelte';
import EncounterTracker from '../EncounterTracker.svelte';

const { ApplicationV2 } = foundry.applications.api;

export class EncounterTrackerShell extends SvelteApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'ink-flood-encounter-tracker',
    classes: ['ink-flood', 'encounter-tracker'],
    window: {
      title: 'Чернильные манифестации',
      resizable: true,
    },
    position: {
      width: 400,
      height: 640,
    },
  };

  get svelteComponent() {
    return EncounterTracker;
  }
}
