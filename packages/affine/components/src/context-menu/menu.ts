import type { TemplateResult } from 'lit';

import { computed, signal } from '@preact/signals-core';

import type { MenuItemRender } from './types.js';

import { menuButtonItems } from './button.js';
import { MenuFocusable } from './focusable.js';
import { menuGroupItems } from './group.js';
import { menuInputItems } from './input.js';
import { MenuComponent } from './menu-renderer.js';
import { subMenuItems } from './sub-menu.js';

const normalMenus = {
  ...menuButtonItems,
  ...subMenuItems,
  ...menuInputItems,
  custom: (
    config: {
      render: (menu: Menu) => TemplateResult | undefined;
    },
    menu
  ) => {
    return config.render(menu);
  },
} satisfies Record<string, MenuItemRender<never>>;
const groupMenus = menuGroupItems;
type normalMenus = typeof normalMenus;
type groupMenus = typeof groupMenus;
export type GroupMenuConfig = {
  [K in keyof groupMenus]: {
    type: K;
  } & Parameters<groupMenus[K]>[0];
}[keyof groupMenus];
export type NormalMenuConfig = {
  [K in keyof normalMenus]: {
    type: K;
    hide?: () => boolean;
  } & Parameters<normalMenus[K]>[0];
}[keyof normalMenus];
const menus = { ...normalMenus, ...groupMenus };
export type MenuConfig = NormalMenuConfig | GroupMenuConfig;

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

  get isSearchMode() {
    return !this.options.disableSearch;
  }

  constructor(public options: MenuOptions) {
    this.menuElement = new MenuComponent();
    this.menuElement.menu = this;
  }

  private renderItem(item: MenuConfig, index: number) {
    if (item.type !== 'group' && item.hide?.() === true) {
      return;
    }
    return menus[item.type](item as never, this, index);
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
      if (item.type !== 'group' && item.hide?.() === true) {
        continue;
      }
      const template = this.renderItem(item, result.length);
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
