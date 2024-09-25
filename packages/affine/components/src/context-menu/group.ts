import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import type { MenuOptions, NormalMenuConfig } from './menu.js';
import type { MenuItemRender } from './types.js';

import { MenuFocusable } from './focusable.js';

export type MenuGroupData = {
  content: () => TemplateResult;
  options: MenuOptions;
  class?: string;
};

export class MenuGroup extends MenuFocusable {
  onClick() {}

  override onPressEnter() {
    this.onClick();
  }

  protected override render(): unknown {
    return html`${this.data.content()}`;
  }

  @property({ attribute: false })
  accessor data!: MenuGroupData;
}

export const menuGroupItems = {
  group: (
    config: {
      name?: string;
      items: NormalMenuConfig[];
    },
    menu
  ) => {
    const items = config.items
      .map(item => menu.renderItem(item))
      .filter(item => item != null);
    if (!items.length) {
      return;
    }
    const result: TemplateResult = html` <div
        style="height: 1px;background-color: var(--affine-divider-color);margin: 8px 0"
      ></div>
      <div style="display: flex;flex-direction: column;gap:4px">${items}</div>`;
    return result;
  },
} satisfies Record<string, MenuItemRender<never>>;
