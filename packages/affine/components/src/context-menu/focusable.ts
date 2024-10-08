import { computed } from '@preact/signals-core';

import { MenuItem } from './item.js';

export abstract class MenuFocusable extends MenuItem {
  isFocused$ = computed(() => this.menu.currentFocused$.value === this);

  override connectedCallback() {
    super.connectedCallback();
    this.dataset.focusable = 'true';
  }

  override focus() {
    this.menu.focusTo(this);
  }

  abstract onPressEnter(): void;
}
