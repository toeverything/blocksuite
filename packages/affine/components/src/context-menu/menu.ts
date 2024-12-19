import type { TemplateResult } from 'lit';

import { IS_MOBILE } from '@blocksuite/global/env';
import { computed, signal } from '@preact/signals-core';

import type { MenuComponentInterface, MenuItemRender } from './types.js';

import { menuButtonItems } from './button.js';
import { menuDynamicItems } from './dynamic.js';
import { MenuFocusable } from './focusable.js';
import { menuGroupItems } from './group.js';
import { menuInputItems } from './input.js';
import { MenuComponent, MobileMenuComponent } from './menu-renderer.js';
import { subMenuItems } from './sub-menu.js';

export const menu = {
  ...menuButtonItems,
  ...subMenuItems,
  ...menuInputItems,
  ...menuGroupItems,
  ...menuDynamicItems,
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
  search?: {
    placeholder?: string;
  };
  items: MenuConfig[];
};

// Global menu open listener type
type MenuOpenListener = (menu: Menu) => (() => void) | void;

// Global menu open listeners
const menuOpenListeners = new Set<MenuOpenListener>();

// Add global menu open listener
export function onMenuOpen(listener: MenuOpenListener) {
  menuOpenListeners.add(listener);
  // Return cleanup function
  return () => {
    menuOpenListeners.delete(listener);
  };
}

export class Menu {
  private _cleanupFns: Array<() => void> = [];

  private _currentFocused$ = signal<MenuFocusable>();

  private _subMenu$ = signal<Menu>();

  closed = false;

  readonly currentFocused$ = computed(() => this._currentFocused$.value);

  menuElement: MenuComponentInterface;

  searchName$ = signal('');

  searchResult$ = computed(() => {
    return this.renderItems(this.options.items);
  });

  showSearch$ = computed(() => {
    return this.enableSearch && this.searchName$.value.length > 0;
  });

  get enableSearch() {
    return true;
  }

  constructor(public options: MenuOptions) {
    this.menuElement = IS_MOBILE
      ? new MobileMenuComponent()
      : new MenuComponent();
    this.menuElement.menu = this;

    // Call global menu open listeners
    menuOpenListeners.forEach(listener => {
      const cleanup = listener(this);
      if (cleanup) {
        this._cleanupFns.push(cleanup);
      }
    });
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    // Execute cleanup functions
    this._cleanupFns.forEach(cleanup => cleanup());
    this._cleanupFns = [];

    this.menuElement.remove();
    this.options.onClose?.();
  }

  closeSubMenu() {
    this._subMenu$.value?.close();
    this._subMenu$.value = undefined;
  }

  focusNext() {
    if (!this._currentFocused$.value) {
      const ele = this.menuElement.getFirstFocusableElement();
      if (ele instanceof MenuFocusable) {
        ele.focus();
      }
      return;
    }
    const list = this.menuElement
      .getFocusableElements()
      .filter(ele => ele instanceof MenuFocusable);
    const index = list.indexOf(this._currentFocused$.value);
    list[index + 1]?.focus();
  }

  focusPrev() {
    if (!this._currentFocused$.value) {
      return;
    }
    const list = this.menuElement
      .getFocusableElements()
      .filter(ele => ele instanceof MenuFocusable);
    const index = list.indexOf(this._currentFocused$.value);
    if (index === 0) {
      this._currentFocused$.value = undefined;
      return;
    }
    list[index - 1]?.focus();
  }

  focusTo(ele?: MenuFocusable) {
    this.menuElement.focusTo(ele);
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
