import type { MenuConfig } from './menu.js';

export type MenuClass = (string & {}) | 'delete-item';
export type MenuItemRender<Props> = (props: Props) => MenuConfig;
