import {
  CheckBoxCkeckSolidIcon,
  CheckBoxUnIcon,
  DoneIcon,
} from '@blocksuite/icons/lit';
import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { MenuClass, MenuItemRender } from './types.js';

import { MenuFocusable } from './focusable.js';

export type MenuButtonData = {
  content: () => TemplateResult;
  class: string;
  select: (ele: HTMLElement) => void | false;
  onHover?: (hover: boolean) => void;
};

export class MenuButton extends MenuFocusable {
  static override styles = css`
    .affine-menu-button {
      display: flex;
      width: 100%;
      font-size: 20px;
      cursor: pointer;
      align-items: center;
      padding: 4px;
      gap: 8px;
      border-radius: 4px;
      color: var(--affine-icon-color);
    }

    .affine-menu-button:hover {
      background-color: var(--affine-hover-color);
    }

    .affine-menu-button .affine-menu-action-text {
      flex: 1;
      font-size: 14px;
      line-height: 22px;
      color: var(--affine-text-primary-color);
    }

    .affine-menu-button.focused {
      outline: 1px solid var(--affine-layer-insideBorder-primaryBorder);
    }

    .affine-menu-button.delete-item:hover {
      background-color: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }

    .affine-menu-button.delete-item:hover .affine-menu-action-text {
      color: var(--affine-error-color);
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'mouseenter', () => {
      this.data.onHover?.(true);
      this.menu.closeSubMenu();
    });
    this.disposables.addFromEvent(this, 'mouseleave', () => {
      this.data.onHover?.(false);
    });
    this.disposables.addFromEvent(this, 'click', this.onClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.data.onHover?.(false);
  }

  onClick() {
    if (this.data.select(this) !== false) {
      this.menu.close();
    }
  }

  override onPressEnter() {
    this.onClick();
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
  accessor data!: MenuButtonData;
}

export const menuButtonItems = {
  action: (
    config: {
      name: string;
      label?: () => TemplateResult;
      prefix?: TemplateResult;
      postfix?: TemplateResult;
      isSelected?: boolean;
      select: (ele: HTMLElement) => void | false;
      onHover?: (hover: boolean) => void;
      class?: MenuClass;
    },
    menu
  ) => {
    if (!menu.search(config.name)) {
      return;
    }
    const data: MenuButtonData = {
      content: () => html`
        ${config.prefix}
        <div class="affine-menu-action-text">
          ${config.label?.() ?? config.name}
        </div>
        ${config.postfix ?? (config.isSelected ? DoneIcon() : undefined)}
      `,
      onHover: config.onHover,
      select: config.select,
      class: config.class ?? (config.isSelected ? 'selected-item' : ''),
    };
    return html` <affine-menu-button
      .data="${data}"
      .menu="${menu}"
    ></affine-menu-button>`;
  },
  checkbox: (
    config: {
      name: string;
      checked: boolean;
      postfix?: TemplateResult;
      label?: () => TemplateResult;
      select: (checked: boolean) => boolean;
      class?: string;
    },
    menu
  ) => {
    if (!menu.search(config.name)) {
      return;
    }
    const data: MenuButtonData = {
      content: () => html`
        <div class="icon">
          ${config.checked
            ? CheckBoxCkeckSolidIcon({ style: `color:#1E96EB` })
            : CheckBoxUnIcon()}
        </div>
        <div class="affine-menu-action-text">
          ${config.label?.() ?? config.name}
        </div>
        ${config.postfix}
      `,
      select: () => {
        config.select(config.checked);
        return false;
      },
      class: config.class ?? '',
    };
    return html`
      <affine-menu-button.data='${data}'.menu='${menu}'></affine-menu-button>`;
  },
  'toggle-switch': (
    config: {
      name: string;
      on: boolean;
      postfix?: TemplateResult;
      label?: () => TemplateResult;
      onChange: (on: boolean) => void;
      class?: string;
    },
    menu
  ) => {
    if (!menu.search(config.name)) {
      return;
    }
    const onChange = (on: boolean) => {
      config.onChange(on);
    };

    const data: MenuButtonData = {
      content: () => html`
        <div class="affine-menu-action-text">
          ${config.label?.() ?? config.name}
        </div>
        <toggle-switch
          .on="${config.on}"
          .onChange="${onChange}"
        ></toggle-switch>
        ${config.postfix}
      `,
      select: () => {
        config.onChange(config.on);
        return false;
      },
      class: config.class ?? '',
    };
    return html` <affine-menu-button
      .data="${data}"
      .menu="${menu}"
    ></affine-menu-button>`;
  },
} satisfies Record<string, MenuItemRender<never>>;
