import type { TemplateResult, nothing } from 'lit';

export type MenuItemPart = {
  action: () => void;
  disabled?: boolean;
};

export type MenuItem = {
  icon: TemplateResult<1>;
  label: string;
  type?: string;
} & MenuItemPart;

export type MoreMenuItem<T> = Omit<MenuItem, 'action' | 'disabled'> & {
  action?: (context: T) => void | Promise<void>;
  disabled?: boolean | ((context: T) => boolean);
  when?: (context: T) => boolean;
  // Generates action at runtime
  generate?: (context: T) => MenuItemPart | void;
};

export type MoreMenuItemGroup<T> = {
  type: string;
  items: MoreMenuItem<T>[];
  when?: (context: T) => boolean;
};

// Group Actions
export type FatMenuItems = (MenuItem | typeof nothing)[][];
