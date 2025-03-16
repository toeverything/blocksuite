import type { nothing, TemplateResult } from 'lit';

import type { MenuContext } from './menu-context.js';

export type MenuItemPart = {
  action: () => void;
  disabled?: boolean;
  render?: (item: MenuItem) => TemplateResult<1>;
};

export type MenuItem = {
  type: string;
  label?: string;
  tooltip?: string;
  icon?: TemplateResult<1>;
} & MenuItemPart;

export type AdvancedMenuItem<T> = Omit<MenuItem, 'action' | 'disabled'> & {
  action?: (context: T) => void | Promise<void>;
  disabled?: boolean | ((context: T) => boolean);
  when?: (context: T) => boolean;
  // Generates action at runtime
  generate?: (context: T) => MenuItemPart | void;
};

export type MenuItemGroup<T> = {
  type: string;
  items: AdvancedMenuItem<T>[];
  when?: (context: T) => boolean;
};

// Group Actions
export type FatMenuItems = (MenuItem | typeof nothing)[][];

export interface ToolbarMoreMenuConfig {
  configure: <T extends MenuContext>(
    groups: MenuItemGroup<T>[]
  ) => MenuItemGroup<T>[];
}
