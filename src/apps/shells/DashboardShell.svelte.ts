import { SvelteApplicationMixin } from '../../mixins/SvelteApplicationMixin.svelte';
import GMDashboard from '../GMDashboard.svelte';

const { ApplicationV2 } = foundry.applications.api;

export class DashboardShell extends SvelteApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'ink-flood-dashboard',
    classes: ['ink-flood', 'dashboard'],
    window: {
      title: 'Чернильный потоп — Панель ГМ',
      resizable: true,
    },
    position: {
      width: 540,
      height: 660,
    },
  };

  get svelteComponent() {
    return GMDashboard;
  }
}
