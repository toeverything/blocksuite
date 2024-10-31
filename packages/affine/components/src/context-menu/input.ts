import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { css, html, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { MenuItemRender } from './types.js';

import { MenuFocusable } from './focusable.js';

export type MenuInputData = {
  placeholder?: string;
  initialValue?: string;
  class?: string;
  onComplete: (value: string) => void;
  disableAutoFocus?: boolean;
};

export class MenuInput extends MenuFocusable {
  static override styles = css`
    .affine-menu-input {
      flex: 1;
      outline: none;
      border-radius: 4px;
      font-size: 14px;
      line-height: 22px;
      padding: 4px 6px;
      border: 1px solid var(--affine-border-color);
      width: 100%;
      color: ${unsafeCSSVarV2('text/primary')};
      background-color: transparent;
    }

    .affine-menu-input.focused {
      border: 1px solid ${unsafeCSSVarV2('layer/insideBorder/primaryBorder')};
    }

    .affine-menu-input:focus {
      border: 1px solid ${unsafeCSSVarV2('layer/insideBorder/primaryBorder')};
      box-shadow: 0px 0px 0px 2px rgba(28, 158, 228, 0.3);
    }
  `;

  complete() {
    this.data.onComplete(this.inputRef.value);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        this.complete();
        this.inputRef.blur();
        this.menu.focusTo(this);
        return;
      }
      if (e.key === 'Enter') {
        this.complete();
        this.menu.close();
        return;
      }
    });
    this.disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
    });
    this.disposables.addFromEvent(this, 'mouseenter', () => {
      this.menu.closeSubMenu();
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.inputRef.select();
      });
    });
  }

  override onPressEnter() {
    this.inputRef.focus();
  }

  protected override render(): unknown {
    const classString = classMap({
      [this.data.class ?? '']: true,
      'affine-menu-input': true,
      focused: this.isFocused$.value,
    });

    return html`<input
      @focus="${() => {
        this.menu.setFocusOnly(this);
      }}"
      class="${classString}"
      value="${this.data.initialValue ?? ''}"
      type="text"
    />`;
  }

  @property({ attribute: false })
  accessor data!: MenuInputData;

  @query('input')
  accessor inputRef!: HTMLInputElement;
}

export const menuInputItems = {
  input:
    (config: {
      placeholder?: string;
      initialValue?: string;
      postfix?: TemplateResult;
      prefix?: TemplateResult;
      onComplete: (value: string) => void;
      class?: string;
    }) =>
    menu => {
      if (menu.showSearch$.value) {
        return;
      }
      const data: MenuInputData = {
        placeholder: config.placeholder,
        initialValue: config.initialValue,
        class: config.class,
        onComplete: config.onComplete,
      };
      return html`
        <div
          style="display:flex;align-items:center;margin-bottom: 8px;gap: 4px;"
        >
          ${config.prefix}
          <affine-menu-input
            style="flex:1"
            .data="${data}"
            .menu="${menu}"
          ></affine-menu-input>
          ${config.postfix}
        </div>
      `;
    },
} satisfies Record<string, MenuItemRender<never>>;
