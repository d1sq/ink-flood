import { SvelteApplicationMixin } from '../../mixins/SvelteApplicationMixin.svelte';
import PlayerTokens from '../PlayerTokens.svelte';

const { ApplicationV2 } = foundry.applications.api;

export class PlayerTokensShell extends SvelteApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'ink-flood-player-tokens',
    classes: ['ink-flood', 'player-tokens'],
    window: {
      title: 'Токены Прозрения',
      resizable: true,
    },
    position: {
      width: 320,
      height: 440,
    },
  };

  get svelteComponent() {
    return PlayerTokens;
  }
}
