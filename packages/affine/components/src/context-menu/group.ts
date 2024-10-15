import { html, type TemplateResult } from 'lit';

import type { MenuConfig } from './menu.js';
import type { MenuItemRender } from './types.js';

export const menuGroupItems = {
  group: (config: { name?: string; items: MenuConfig[] }) => (menu, index) => {
    const items = menu.renderItems(config.items);
    if (!items.length) {
      return;
    }
    const result: TemplateResult = html` ${index === 0
        ? ''
        : html` <div
            style="height: 1px;background-color: var(--affine-divider-color);margin: 4px 0"
          ></div>`}
      <div style="display: flex;flex-direction: column;gap:4px">${items}</div>`;
    return result;
  },
} satisfies Record<string, MenuItemRender<never>>;
