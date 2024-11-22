import type { ClassInfo } from 'lit-html/directives/class-map.js';

import type { MenuFocusable } from './focusable.js';
import type { Menu, MenuConfig } from './menu.js';

export type MenuClass = ClassInfo & {
  'delete-item'?: boolean;
};
export type MenuItemRender<Props> = (props: Props) => MenuConfig;

export interface MenuComponentInterface extends HTMLElement {
  menu: Menu;

  remove(): void;

  getFocusableElements(): HTMLElement[];

  getFirstFocusableElement(): HTMLElement | null;

  focusTo(ele?: MenuFocusable): void;
}
