import type { TemplateResult } from 'lit';

import { computed, signal } from '@preact/signals-core';

import type { MenuItemRender } from './types.js';

import { menuButtonItems } from './button.js';
import { MenuFocusable } from './focusable.js';
import { menuGroupItems } from './group.js';
import { menuInputItems } from './input.js';
import { MenuComponent } from './menu-renderer.js';
import { subMenuItems } from './sub-menu.js';

export const menu = {
  ...menuButtonItems,
  ...subMenuItems,
  ...menuInputItems,
  ...menuGroupItems,
} satisfies Record<string, MenuItemRender<never>>;
export type MenuConfig = (
  menu: Menu,
  index: number
) => TemplateResult | undefined;

export type MenuOptions = {
  onComplete?: () => void;
  onClose?: () => void;
  title?: {
    text: string;
    onBack?: (menu: Menu) => void;
    onClose?: () => void;
    postfix?: () => TemplateResult;
  };
  disableSearch?: boolean;
  items: MenuConfig[];
};

export class Menu {
  private _currentFocused$ = signal<MenuFocusable>();

  private _subMenu$ = signal<Menu>();

  readonly currentFocused$ = computed(() => this._currentFocused$.value);

  menuElement: MenuComponent;

  searchName$ = signal('');

  searchResult$ = computed(() => {
    return this.renderItems(this.options.items);
  });

  showSearch$ = computed(() => {
    return this.isSearchMode && this.searchName$.value.length > 0;
  });

  get isSearchMode() {
    return !this.options.disableSearch;
  }

  constructor(public options: MenuOptions) {
    this.menuElement = new MenuComponent();
    this.menuElement.menu = this;
  }

  close() {
    this.menuElement.remove();
    this.options.onClose?.();
  }

  closeSubMenu() {
    this._subMenu$.value?.close();
    this._subMenu$.value = undefined;
  }

  focusNext() {
    if (!this._currentFocused$.value) {
      const ele = this.menuElement.querySelector('[data-focusable="true"]');
      if (ele instanceof MenuFocusable) {
        ele.focus();
      }
      return;
    }
    const list = Array.from(
      this.menuElement.querySelectorAll('[data-focusable="true"]')
    ).filter(ele => ele instanceof MenuFocusable);
    const index = list.indexOf(this._currentFocused$.value);
    list[index + 1]?.focus();
  }

  focusPrev() {
    if (!this._currentFocused$.value) {
      return;
    }
    const list = Array.from(
      this.menuElement.querySelectorAll('[data-focusable="true"]')
    ).filter(ele => ele instanceof MenuFocusable);
    const index = list.indexOf(this._currentFocused$.value);
    if (index === 0) {
      this._currentFocused$.value = undefined;
      return;
    }
    list[index - 1]?.focus();
  }

  focusSearch() {
    this.menuElement.focusInput();
  }

  focusTo(ele?: MenuFocusable) {
    this.setFocusOnly(ele);
    this.focusSearch();
  }

  openSubMenu(menu: Menu) {
    this.closeSubMenu();
    this._subMenu$.value = menu;
  }

  pressEnter() {
    this._currentFocused$.value?.onPressEnter();
  }

  renderItems(items: MenuConfig[]) {
    const result = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const template = item(this, result.length);
      if (template != null) {
        result.push(template);
      }
    }
    return result;
  }

  search(name: string) {
    return name.toLowerCase().includes(this.searchName$.value.toLowerCase());
  }

  setFocusOnly(ele?: MenuFocusable) {
    this._currentFocused$.value = ele;
  }
}
