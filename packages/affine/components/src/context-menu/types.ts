import type { ClassInfo } from 'lit-html/directives/class-map.js';

import type { MenuConfig } from './menu.js';

export type MenuClass = ClassInfo & {
  'delete-item'?: boolean;
};
export type MenuItemRender<Props> = (props: Props) => MenuConfig;
