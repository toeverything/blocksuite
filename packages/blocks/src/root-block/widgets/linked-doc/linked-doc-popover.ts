import { MoreHorizontalIcon } from '@blocksuite/affine-components/icons';
import {
  getCurrentNativeRange,
  getViewportElement,
} from '@blocksuite/affine-shared/utils';
import { PropTypes, requiredProperties } from '@blocksuite/block-std';
import {
  SignalWatcher,
  throttle,
  WithDisposable,
} from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { property, query, queryAll, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { IconButton } from '../../../_common/components/button.js';
import type { LinkedDocContext, LinkedMenuGroup } from './config.js';

import {
  cleanSpecifiedTail,
  createKeydownObserver,
  getQuery,
} from '../../../_common/components/utils.js';
import { getPopperPosition } from '../../utils/position.js';
import { linkedDocPopoverStyles } from './styles.js';

@requiredProperties({
  context: PropTypes.object,
})
export class LinkedDocPopover extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = linkedDocPopoverStyles;

  private _abort = () => {
    // remove popover dom
    this.context.close();
    // clear input query
    cleanSpecifiedTail(
      this.context.std.host,
      this.context.inlineEditor,
      this.context.triggerKey + (this._query || '')
    );
  };

  private _expanded = new Map<string, boolean>();

  private _updateLinkedDocGroup = async () => {
    const query = this._query;
    if (this._updateLinkedDocGroupAbortController) {
      this._updateLinkedDocGroupAbortController.abort();
    }
    this._updateLinkedDocGroupAbortController = new AbortController();

    if (query === null) {
      this.context.close();
      return;
    }
    this._linkedDocGroup = await this.context.config.getMenus(
      query,
      this._abort,
      this.context.std.host,
      this.context.inlineEditor,
      this._updateLinkedDocGroupAbortController.signal
    );
  };

  private _updateLinkedDocGroupAbortController: AbortController | null = null;

  private get _actionGroup() {
    return this._linkedDocGroup.map(group => {
      return {
        ...group,
        items: this._getActionItems(group),
      };
    });
  }

  private get _flattenActionList() {
    return this._actionGroup
      .map(group =>
        group.items.map(item => ({ ...item, groupName: group.name }))
      )
      .flat();
  }

  private get _query() {
    return getQuery(this.context.inlineEditor, this.context.startRange);
  }

  private _getActionItems(group: LinkedMenuGroup) {
    const isExpanded = !!this._expanded.get(group.name);
    const items = Array.isArray(group.items) ? group.items : group.items.value;
    if (isExpanded) {
      return items;
    }
    const isOverflow = !!group.maxDisplay && items.length > group.maxDisplay;
    if (isOverflow) {
      return items.slice(0, group.maxDisplay).concat({
        key: `${group.name} More`,
        name: group.overflowText || 'more',
        icon: MoreHorizontalIcon,
        action: () => {
          this._expanded.set(group.name, true);
          this.requestUpdate();
        },
      });
    }
    return items;
  }

  private _isTextOverflowing(element: HTMLElement) {
    return element.scrollWidth > element.clientWidth;
  }

  override connectedCallback() {
    super.connectedCallback();

    // init
    this._updateLinkedDocGroup().catch(console.error);
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });
    this._disposables.addFromEvent(window, 'mousedown', e => {
      if (e.target === this) return;
      // We don't clear the query when clicking outside the popover
      this.context.close();
    });

    const keydownObserverAbortController = new AbortController();
    this._disposables.add(() => keydownObserverAbortController.abort());

    const { eventSource } = this.context.inlineEditor;
    if (!eventSource) return;

    createKeydownObserver({
      target: eventSource,
      signal: keydownObserverAbortController.signal,
      onInput: isComposition => {
        this._activatedItemIndex = 0;
        if (isComposition) {
          this._updateLinkedDocGroup().catch(console.error);
        } else {
          this.context.inlineEditor.slots.renderComplete.once(
            this._updateLinkedDocGroup
          );
        }
      },
      onPaste: () => {
        this._activatedItemIndex = 0;
        setTimeout(() => {
          this._updateLinkedDocGroup().catch(console.error);
        }, 50);
      },
      onDelete: () => {
        const curRange = this.context.inlineEditor.getInlineRange();
        if (!this.context.startRange || !curRange) {
          return;
        }
        if (curRange.index < this.context.startRange.index) {
          this.context.close();
        }
        this._activatedItemIndex = 0;
        this.context.inlineEditor.slots.renderComplete.once(
          this._updateLinkedDocGroup
        );
      },
      onMove: step => {
        const itemLen = this._flattenActionList.length;
        this._activatedItemIndex =
          (itemLen + this._activatedItemIndex + step) % itemLen;

        // Scroll to the active item
        const item = this._flattenActionList[this._activatedItemIndex];
        const shadowRoot = this.shadowRoot;
        if (!shadowRoot) {
          console.warn('Failed to find the shadow root!', this);
          return;
        }
        const ele = shadowRoot.querySelector(
          `icon-button[data-id="${item.key}"]`
        );
        if (!ele) {
          console.warn('Failed to find the active item!', item);
          return;
        }
        ele.scrollIntoView({
          block: 'nearest',
        });
      },
      onConfirm: () => {
        this._flattenActionList[this._activatedItemIndex]
          .action()
          ?.catch(console.error);
      },
      onAbort: () => {
        this.context.close();
      },
    });
  }

  override render() {
    const MAX_HEIGHT = 380;
    const style = this._position
      ? styleMap({
          transform: `translate(${this._position.x}, ${this._position.y})`,
          maxHeight: `${Math.min(this._position.height, MAX_HEIGHT)}px`,
        })
      : styleMap({
          visibility: 'hidden',
        });

    // XXX This is a side effect
    let accIdx = 0;
    return html`<div class="linked-doc-popover" style="${style}">
      ${this._actionGroup
        .filter(group => group.items.length)
        .map((group, idx) => {
          return html`
            <div class="divider" ?hidden=${idx === 0}></div>
            <div class="group-title">${group.name}</div>
            <div class="group" style=${group.styles ?? ''}>
              ${group.items.map(({ key, name, icon, action }) => {
                accIdx++;
                const curIdx = accIdx - 1;
                const tooltip = this._showTooltip
                  ? html`<affine-tooltip tip-position=${'right'}
                      >${name}</affine-tooltip
                    >`
                  : nothing;
                return html`<icon-button
                  width="280px"
                  height="30px"
                  data-id=${key}
                  .text=${name}
                  hover=${this._activatedItemIndex === curIdx}
                  @click=${() => {
                    action()?.catch(console.error);
                  }}
                  @mousemove=${() => {
                    // Use `mousemove` instead of `mouseover` to avoid navigate conflict with keyboard
                    this._activatedItemIndex = curIdx;
                    // show tooltip whether text length overflows
                    for (const button of this.iconButtons.values()) {
                      if (button.dataset.id == key && button.textElement) {
                        const isOverflowing = this._isTextOverflowing(
                          button.textElement
                        );
                        this._showTooltip = isOverflowing;
                        break;
                      }
                    }
                  }}
                >
                  ${icon} ${tooltip}
                </icon-button>`;
              })}
            </div>
          `;
        })}
    </div>`;
  }

  updatePosition(position: { height: number; x: string; y: string }) {
    this._position = position;
  }

  override willUpdate() {
    if (!this.hasUpdated) {
      const curRange = getCurrentNativeRange();
      if (!curRange) return;

      const updatePosition = throttle(() => {
        const position = getPopperPosition(this, curRange);
        this.updatePosition(position);
      }, 10);

      this.disposables.addFromEvent(window, 'resize', updatePosition);
      const scrollContainer = getViewportElement(this.context.std.host);
      if (scrollContainer) {
        // Note: in edgeless mode, the scroll container is not exist!
        this.disposables.addFromEvent(
          scrollContainer,
          'scroll',
          updatePosition,
          {
            passive: true,
          }
        );
      }
      updatePosition();
    }
  }

  @state()
  private accessor _activatedItemIndex = 0;

  @state()
  private accessor _linkedDocGroup: LinkedMenuGroup[] = [];

  @state()
  private accessor _position: {
    height: number;
    x: string;
    y: string;
  } | null = null;

  @state()
  private accessor _showTooltip = false;

  @property({ attribute: false })
  accessor context!: LinkedDocContext;

  @queryAll('icon-button')
  accessor iconButtons!: NodeListOf<IconButton>;

  @query('.linked-doc-popover')
  accessor linkedDocElement: Element | null = null;
}
