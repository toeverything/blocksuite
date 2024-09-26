import type { TemplateResult } from 'lit';

import type { Menu } from './menu.js';

export type MenuClass = (string & {}) | 'delete-item';
export type MenuItemRender<Props> = (
  props: Props,
  menu: Menu,
  index: number
) => TemplateResult | undefined;
