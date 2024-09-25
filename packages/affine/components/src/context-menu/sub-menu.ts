import { ArrowRightSmallIcon } from '@blocksuite/icons/lit';
import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { MenuOptions } from './menu.js';
import type { MenuItemRender } from './types.js';

import { MenuFocusable } from './focusable.js';

export type MenuSubMenuData = {
  content: () => TemplateResult;
  options: MenuOptions;
  class?: string;
};

export class MenuSubMenu extends MenuFocusable {
  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'mouseenter', this.onMouseEnter);
  }

  onMouseEnter() {
    this.menu.openSubMenu();
  }

  override onPressEnter() {
    this.onMouseEnter();
  }

  protected override render(): unknown {
    const classString = classMap({
      [this.data.class ?? '']: true,
      'affine-menu-button': true,
      focused: this.isFocused$.value,
    });
    return html` <div class="${classString}">${this.data.content()}</div>`;
  }

  @property({ attribute: false })
  accessor data!: MenuSubMenuData;
}

export const subMenuItems = {
  'sub-menu': (
    config: {
      name: string;
      label?: () => TemplateResult;
      postfix?: TemplateResult;
      prefix?: TemplateResult;
      class?: string;
      options: MenuOptions;
    },
    menu
  ) => {
    if (!menu.search(config.name)) {
      return;
    }
    const data: MenuSubMenuData = {
      content: () =>
        html`${config.prefix}
          <div class="affine-menu-action-text">
            ${config.label?.() ?? config.name}
          </div>
          ${config.postfix ?? ArrowRightSmallIcon()}`,
      class: config.class,
      options: config.options,
    };
    return html` <affine-menu-sub-menu
      .data="${data}"
      .menu="${menu}"
    ></affine-menu-sub-menu>`;
  },
} satisfies Record<string, MenuItemRender<never>>;
