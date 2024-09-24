import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { EditorHost } from '@blocksuite/block-std';

import { MoreHorizontalIcon } from '@blocksuite/affine-components/icons';
import { WithDisposable } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { query, queryAll, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { IconButton } from '../../../_common/components/button.js';
import type { LinkedMenuGroup } from './config.js';

import {
  cleanSpecifiedTail,
  createKeydownObserver,
  getQuery,
} from '../../../_common/components/utils.js';
import { styles } from './styles.js';

export class LinkedDocPopover extends WithDisposable(LitElement) {
  static override styles = styles;

  private _abort = () => {
    // remove popover dom
    this.abortController.abort();
    // clear input query
    cleanSpecifiedTail(
      this.editorHost,
      this.inlineEditor,
      this.triggerKey + (this._query || '')
    );
  };

  private _expanded = new Map<string, boolean>();

  private _startRange = this.inlineEditor.getInlineRange();

  private _updateLinkedDocGroup = async () => {
    const query = this._query;

    if (query === null) {
      this.abortController.abort();
      return;
    }
    this._linkedDocGroup = await this.getMenus(
      query,
      this._abort,
      this.editorHost,
      this.inlineEditor
    );
  };

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
    return getQuery(this.inlineEditor, this._startRange);
  }

  constructor(
    private triggerKey: string,
    private getMenus: (
      query: string,
      abort: () => void,
      editorHost: EditorHost,
      inlineEditor: AffineInlineEditor
    ) => Promise<LinkedMenuGroup[]>,
    private editorHost: EditorHost,
    private inlineEditor: AffineInlineEditor,
    private abortController: AbortController
  ) {
    super();
  }

  private _getActionItems(group: LinkedMenuGroup) {
    const isExpanded = !!this._expanded.get(group.name);
    if (isExpanded) {
      return group.items;
    }
    const isOverflow =
      !!group.maxDisplay && group.items.length > group.maxDisplay;
    if (isOverflow) {
      return group.items.slice(0, group.maxDisplay).concat({
        key: `${group.name} More`,
        name: group.overflowText || 'more',
        icon: MoreHorizontalIcon,
        action: () => {
          this._expanded.set(group.name, true);
          this.requestUpdate();
        },
      });
    }
    return group.items;
  }

  private _isTextOverflowing(element: HTMLElement) {
    return element.scrollWidth > element.clientWidth;
  }

  override connectedCallback() {
    super.connectedCallback();

    // init
    void this._updateLinkedDocGroup();
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    const { eventSource } = this.inlineEditor;
    if (!eventSource) return;
    createKeydownObserver({
      target: eventSource,
      signal: this.abortController.signal,
      onInput: isComposition => {
        this._activatedItemIndex = 0;
        if (isComposition) {
          this._updateLinkedDocGroup().catch(console.error);
        } else {
          this.inlineEditor.slots.renderComplete.once(
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
        const curRange = this.inlineEditor.getInlineRange();
        if (!this._startRange || !curRange) {
          return;
        }
        if (curRange.index < this._startRange.index) {
          this.abortController.abort();
        }
        this._activatedItemIndex = 0;
        this.inlineEditor.slots.renderComplete.once(this._updateLinkedDocGroup);
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
        this.abortController.abort();
      },
    });
  }

  override render() {
    const MAX_HEIGHT = 410;
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
                  height="32px"
                  data-id=${key}
                  text=${name}
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

  @queryAll('icon-button')
  accessor iconButtons!: NodeListOf<IconButton>;

  @query('.linked-doc-popover')
  accessor linkedDocElement: Element | null = null;
}
