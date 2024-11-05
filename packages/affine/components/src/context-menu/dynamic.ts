import { html, type TemplateResult } from 'lit';

import type { MenuConfig } from './menu.js';
import type { MenuItemRender } from './types.js';

export const menuDynamicItems = {
  dynamic: (config: () => MenuConfig[]) => menu => {
    const items = menu.renderItems(config());
    if (!items.length) {
      return;
    }
    const result: TemplateResult = html`${items}`;
    return result;
  },
} satisfies Record<string, MenuItemRender<never>>;
