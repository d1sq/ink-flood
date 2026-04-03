import { SvelteApplication } from '#runtime/svelte/application';
import GMDashboard from '../GMDashboard.svelte';

export class DashboardShell extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'ink-flood-dashboard',
      title: 'Чернильный потоп — Панель ГМ',
      width: 540,
      height: 660,
      resizable: true,
      svelte: {
        class: GMDashboard,
        target: document.body,
      },
    });
  }
}
