import type { InlineRange } from '@blocksuite/inline';

import {
  VirtualKeyboardController,
  type VirtualKeyboardControllerConfig,
} from '@blocksuite/affine-components/virtual-keyboard';
import { PropTypes, requiredProperties } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { signal } from '@preact/signals-core';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type {
  LinkedDocContext,
  LinkedMenuGroup,
  LinkedMenuItem,
} from './config.js';

import { mobileLinkedDocMenuStyles } from './styles.js';

export const AFFINE_MOBILE_LINKED_DOC_MENU = 'affine-mobile-linked-doc-menu';

@requiredProperties({
  context: PropTypes.object,
})
export class AffineMobileLinkedDocMenu extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = mobileLinkedDocMenuStyles;

  private readonly _keyboardController = new VirtualKeyboardController(this);

  private readonly _linkedDocGroup$ = signal<LinkedMenuGroup[]>([]);

  private readonly _renderInput = () => {
    return html`
      <div class="input-container">
        <div class="prefix">@</div>
        <input type="text" @input=${this._updateLinkedDocGroup} />
      </div>
    `;
  };

  private readonly _renderItem = ({
    key,
    name,
    icon,
    action,
  }: LinkedMenuItem) => {
    return html`<div
      class="mobile-linked-doc-menu-item"
      data-id=${key}
      @click=${() => {
        this.context.inlineEditor.setInlineRange(this._startRange);
        action()?.catch(console.error);
      }}
    >
      ${icon}
      <div class="text">${name}</div>
    </div>`;
  };

  private readonly _renderMenu = () => {
    if (this._linkedDocGroup$.value.length !== 2) {
      return nothing;
    }

    let group = this._linkedDocGroup$.value[0];
    let { items } = group;

    if (group.items.length === 0) {
      group = this._linkedDocGroup$.value[1];
      items = group.items.filter(item => item.name !== 'Import');
    }

    const isOverflow =
      !!group.maxDisplay && group.items.length > group.maxDisplay;

    let moreItem = null;
    if (!this._expand && isOverflow) {
      items = group.items.slice(0, group.maxDisplay);

      moreItem = html`<div
        class="mobile-linked-doc-menu-item"
        @click=${() => {
          this._expand = true;
        }}
      >
        ${MoreHorizontalIcon()}
        <div class="text">${group.overflowText || 'more'}</div>
      </div>`;
    }

    const paddingBottom =
      this.context.config.mobile.useScreenHeight &&
      this._keyboardController.opened
        ? '0px'
        : `${this._keyboardController.keyboardHeight}px`;

    return html`<div
      class="mobile-linked-doc-menu"
      style=${styleMap({
        paddingBottom,
      })}
    >
      ${repeat(items, item => item.key, this._renderItem)} ${moreItem}
    </div>`;
  };

  private _startRange: InlineRange | null = null;

  private readonly _updateLinkedDocGroup = async () => {
    const query = this._inputElement?.value ?? '';

    this._linkedDocGroup$.value = await this.context.config.getMenus(
      query,
      this.context.close,
      this.context.std.host,
      this.context.inlineEditor
    );
  };

  get virtualKeyboardControllerConfig(): VirtualKeyboardControllerConfig {
    return {
      // TODO(@L-Sun): add a flag to control this
      useScreenHeight: false,
      inputElement: this._inputElement,
    };
  }

  override connectedCallback() {
    super.connectedCallback();
    this._startRange = this.context.inlineEditor.getInlineRange();
    this._updateLinkedDocGroup().catch(console.error);
  }

  override firstUpdated() {
    setTimeout(() => {
      this._inputElement?.focus();
    });
    this.disposables.addFromEvent(window, 'mousedown', e => {
      if (e.target === this) return;
      this.context.close();
    });
  }

  override render() {
    return html`${this._renderInput()} ${this._renderMenu()}`;
  }

  override updated(changedProperties: PropertyValues) {
    if (changedProperties.has('_expand')) {
      setTimeout(() => {
        this._inputElement?.focus();
      });
    }
  }

  @state()
  private accessor _expand = false;

  @query('.input-container>input')
  private accessor _inputElement: HTMLInputElement | null = null;

  @property({ attribute: false })
  accessor context!: LinkedDocContext;
}
