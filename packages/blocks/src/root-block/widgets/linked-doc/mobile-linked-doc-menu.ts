import {
  VirtualKeyboardController,
  type VirtualKeyboardControllerConfig,
} from '@blocksuite/affine-components/virtual-keyboard';
import { getViewportElement } from '@blocksuite/affine-shared/utils';
import { PropTypes, requiredProperties } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { signal } from '@preact/signals-core';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type {
  LinkedDocContext,
  LinkedMenuGroup,
  LinkedMenuItem,
} from './config.js';

import {
  cleanSpecifiedTail,
  createKeydownObserver,
  getQuery,
} from '../../../_common/components/utils.js';
import { mobileLinkedDocMenuStyles } from './styles.js';

export const AFFINE_MOBILE_LINKED_DOC_MENU = 'affine-mobile-linked-doc-menu';

@requiredProperties({
  context: PropTypes.object,
})
export class AffineMobileLinkedDocMenu extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = mobileLinkedDocMenuStyles;

  private readonly _expand$ = signal(false);

  private _firstActionItem: LinkedMenuItem | null = null;

  private readonly _keyboardController = new VirtualKeyboardController(this);

  private readonly _linkedDocGroup$ = signal<LinkedMenuGroup[]>([]);

  private readonly _renderItem = ({
    key,
    name,
    icon,
    action,
  }: LinkedMenuItem) => {
    return html`<button
      class="mobile-linked-doc-menu-item"
      data-id=${key}
      @pointerup=${() => {
        action()?.catch(console.error);
      }}
    >
      ${icon}
      <div class="text">${name}</div>
    </button>`;
  };

  private readonly _updateLinkedDocGroup = async () => {
    this._linkedDocGroup$.value = await this.context.config.getMenus(
      this._query ?? '',
      () => {
        this.context.close();
        cleanSpecifiedTail(
          this.context.std.host,
          this.context.inlineEditor,
          this.context.triggerKey + (this._query ?? '')
        );
      },
      this.context.std.host,
      this.context.inlineEditor
    );
  };

  private get _query() {
    return getQuery(this.context.inlineEditor, this.context.startRange);
  }

  get virtualKeyboardControllerConfig(): VirtualKeyboardControllerConfig {
    return {
      useScreenHeight: this.context.config.mobile.useScreenHeight ?? false,
      inputElement: this.context.std.host,
    };
  }

  override connectedCallback() {
    super.connectedCallback();

    const { inlineEditor, close } = this.context;

    this._updateLinkedDocGroup().catch(console.error);

    // prevent editor blur when click menu
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      e.preventDefault();
    });

    // close menu when click outside
    this.disposables.addFromEvent(
      window,
      'pointerdown',
      e => {
        if (e.target === this) return;
        close();
      },
      true
    );

    // bind some key events
    {
      const { eventSource } = inlineEditor;
      if (!eventSource) return;

      const keydownObserverAbortController = new AbortController();
      this._disposables.add(() => keydownObserverAbortController.abort());

      createKeydownObserver({
        target: eventSource,
        signal: keydownObserverAbortController.signal,
        onInput: isComposition => {
          if (isComposition) {
            this._updateLinkedDocGroup().catch(console.error);
          } else {
            inlineEditor.slots.renderComplete.once(this._updateLinkedDocGroup);
          }
        },
        onDelete: () => {
          const curRange = inlineEditor.getInlineRange();
          if (!this.context.startRange || !curRange) return;

          if (curRange.index < this.context.startRange.index) {
            this.context.close();
          }
          inlineEditor.slots.renderComplete.once(this._updateLinkedDocGroup);
        },
        onConfirm: () => {
          this._firstActionItem?.action()?.catch(console.error);
        },
        onAbort: () => {
          this.context.close();
        },
      });
    }

    // scroll block above the menu
    {
      // TODO(@L-Sun): header offset

      const { scrollContainer, scrollTopOffset } = this.context.config.mobile;

      let container = null;
      let containerScrollTop = 0;
      if (typeof scrollContainer === 'string') {
        container = document.querySelector(scrollContainer);
        containerScrollTop = container?.scrollTop ?? 0;
      } else if (scrollContainer instanceof HTMLElement) {
        container = scrollContainer;
        containerScrollTop = scrollContainer.scrollTop;
      } else if (scrollContainer === window) {
        container = window;
        containerScrollTop = scrollContainer.scrollY;
      } else {
        container = getViewportElement(this.context.std.host);
        containerScrollTop = container?.scrollTop ?? 0;
      }

      let offset = 0;
      if (typeof scrollTopOffset === 'function') {
        offset = scrollTopOffset();
      } else {
        offset = scrollTopOffset ?? 0;
      }

      container?.scrollTo({
        top:
          inlineEditor.rootElement.getBoundingClientRect().top +
          containerScrollTop -
          offset,
        behavior: 'smooth',
      });
    }
  }

  override render() {
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
    if (!this._expand$.value && isOverflow) {
      items = group.items.slice(0, group.maxDisplay);

      moreItem = html`<div
        class="mobile-linked-doc-menu-item"
        @click=${() => {
          this._expand$.value = true;
        }}
      >
        ${MoreHorizontalIcon()}
        <div class="text">${group.overflowText || 'more'}</div>
      </div>`;
    }

    this._firstActionItem = items[0];

    this.style.bottom =
      this.context.config.mobile.useScreenHeight &&
      this._keyboardController.opened
        ? '0px'
        : `max(0px, ${this._keyboardController.keyboardHeight}px)`;

    return html`
      ${repeat(items, item => item.key, this._renderItem)} ${moreItem}
    `;
  }

  @property({ attribute: false })
  accessor context!: LinkedDocContext;
}
