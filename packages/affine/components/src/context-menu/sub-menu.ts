import { ArrowRightSmallIcon } from '@blocksuite/icons/lit';
import {
  autoPlacement,
  autoUpdate,
  computePosition,
  offset,
} from '@floating-ui/dom';
import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { MenuItemRender } from './types.js';

import { MenuFocusable } from './focusable.js';
import { Menu, type MenuOptions } from './menu.js';

export type MenuSubMenuData = {
  content: () => TemplateResult;
  options: MenuOptions;
  select?: () => void;
  class?: string;
};

export class MenuSubMenu extends MenuFocusable {
  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'mouseenter', this.onMouseEnter);
    this.disposables.addFromEvent(this, 'click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.data.select) {
        this.data.select();
        this.menu.close();
      } else {
        this.openSubMenu();
      }
    });
  }

  onMouseEnter() {
    this.openSubMenu();
  }

  override onPressEnter() {
    this.onMouseEnter();
  }

  openSubMenu() {
    const focus = this.menu.currentFocused$.value;
    const menu = new Menu({
      ...this.data.options,
      onComplete: () => {
        this.menu.close();
      },
      onClose: () => {
        menu.menuElement.remove();
        this.menu.focusTo(focus);
        this.data.options.onClose?.();
        unsub();
      },
    });
    this.menu.menuElement.parentElement?.append(menu.menuElement);
    const unsub = autoUpdate(this, menu.menuElement, () => {
      computePosition(this, menu.menuElement, {
        middleware: [
          autoPlacement({
            allowedPlacements: ['right-start', 'left-start'],
          }),
          offset({
            mainAxis: 16,
            crossAxis: -8.5,
          }),
        ],
      })
        .then(({ x, y }) => {
          menu.menuElement.style.left = `${x}px`;
          menu.menuElement.style.top = `${y}px`;
        })
        .catch(err => console.error(err));
    });
    this.menu.openSubMenu(menu);
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
  subMenu:
    (config: {
      name: string;
      label?: () => TemplateResult;
      select?: () => void;
      isSelected?: boolean;
      postfix?: TemplateResult;
      prefix?: TemplateResult;
      class?: string;
      options: MenuOptions;
      disableArrow?: boolean;
      hide?: () => boolean;
    }) =>
    menu => {
      if (config.hide?.() || !menu.search(config.name)) {
        return;
      }
      const data: MenuSubMenuData = {
        content: () =>
          html`${config.prefix}
            <div class="affine-menu-action-text">
              ${config.label?.() ?? config.name}
            </div>
            ${config.postfix}
            ${config.disableArrow ? nothing : ArrowRightSmallIcon()} `,
        class: config.class,
        options: config.options,
      };
      return html` <affine-menu-sub-menu
        .data="${data}"
        .menu="${menu}"
      ></affine-menu-sub-menu>`;
    },
} satisfies Record<string, MenuItemRender<never>>;
