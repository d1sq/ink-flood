import { mount, unmount } from 'svelte';
import type { Component } from 'svelte';

/**
 * Mixin that adds Svelte component mounting to ApplicationV2.
 * Pattern from Tidy 5e Sheets — mount once, update reactively.
 */
export function SvelteApplicationMixin(BaseApplication: any) {
  return class SvelteApplication extends BaseApplication {
    #components: Record<string, any>[] = [];
    #svelteTarget: HTMLElement | null = null;

    /**
     * Override in subclass: return the Svelte component class to mount.
     */
    get svelteComponent(): Component<any> {
      throw new Error('svelteComponent must be defined in subclass');
    }

    /**
     * Override in subclass: return props to pass to the Svelte component.
     */
    getSvelteProps(): Record<string, any> {
      return {};
    }

    async _renderHTML(
      context: any,
      options: any
    ): Promise<any> {
      return {};
    }

    _replaceHTML(
      result: any,
      content: HTMLElement,
      options: any
    ): void {
      // First render: mount Svelte component
      if (!this.#svelteTarget) {
        this.#svelteTarget = content;
        const component = mount(this.svelteComponent, {
          target: content,
          props: this.getSvelteProps(),
        });
        this.#components.push(component);
      }
      // Subsequent renders: Svelte handles updates via stores
    }

    async close(options: any = {}) {
      this.#components.forEach((c) => {
        try { unmount(c); } catch (_) { /* already unmounted */ }
      });
      this.#components = [];
      this.#svelteTarget = null;
      await super.close(options);
    }
  };
}
