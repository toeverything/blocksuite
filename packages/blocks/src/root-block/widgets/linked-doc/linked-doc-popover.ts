import type { EditorHost } from '@blocksuite/block-std';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineInlineEditor } from '../../../_common/inline/presets/affine-inline-specs.js';
import type { LinkedDocOptions } from './config.js';
import type { LinkedDocGroup } from './config.js';

import '../../../_common/components/button.js';
import {
  cleanSpecifiedTail,
  createKeydownObserver,
  getQuery,
} from '../../../_common/components/utils.js';
import { MoreHorizontalIcon } from '../../../_common/icons/edgeless.js';
import { styles } from './styles.js';

@customElement('affine-linked-doc-popover')
export class LinkedDocPopover extends WithDisposable(LitElement) {
  private _abort = () => {
    // remove popover dom
    this.abortController.abort();
    // clear input query
    cleanSpecifiedTail(
      this.editorHost,
      this.inlineEditor,
      this.triggerKey + this._query
    );
  };

  private _expanded = new Map<string, boolean>();

  private _getLinkedDocGroup = () => {
    return this.options.getMenus({
      editorHost: this.editorHost,
      query: this._query,
      abort: this._abort,
      inlineEditor: this.inlineEditor,
      docMetas: this._doc.collection.meta.docMetas,
    });
  };

  private _startIndex = this.inlineEditor?.getInlineRange()?.index ?? 0;

  static override styles = styles;

  constructor(
    private editorHost: EditorHost,
    private inlineEditor: AffineInlineEditor,
    private abortController = new AbortController()
  ) {
    super();
  }

  private get _actionGroup() {
    return this._linkedDocGroup.map(group => {
      return {
        ...group,
        items: this._getActionItems(group),
      };
    });
  }

  private get _doc() {
    return this.editorHost.doc;
  }

  private get _flattenActionList() {
    return this._actionGroup
      .map(group =>
        group.items.map(item => ({ ...item, groupName: group.name }))
      )
      .flat();
  }

  private _getActionItems(group: LinkedDocGroup) {
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

  private get _query() {
    return getQuery(this.inlineEditor, this._startIndex) || '';
  }

  override connectedCallback() {
    super.connectedCallback();
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor, 'RichText InlineEditor not found');

    // init
    this._linkedDocGroup = this._getLinkedDocGroup();
    this._disposables.add(
      this._doc.collection.slots.docUpdated.on(() => {
        this._linkedDocGroup = this._getLinkedDocGroup();
      })
    );
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    createKeydownObserver({
      target: inlineEditor.eventSource,
      signal: this.abortController.signal,
      onInput: () => {
        this._activatedItemIndex = 0;
        this._linkedDocGroup = this._getLinkedDocGroup();
      },
      onDelete: () => {
        const curIndex = inlineEditor.getInlineRange()?.index ?? 0;
        if (curIndex < this._startIndex) {
          this.abortController.abort();
        }
        this._activatedItemIndex = 0;
        this._linkedDocGroup = this._getLinkedDocGroup();
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
                  }}
                  >${icon}</icon-button
                >`;
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
  private accessor _linkedDocGroup: LinkedDocGroup[] = [];

  @state()
  private accessor _position: {
    height: number;
    x: string;
    y: string;
  } | null = null;

  @query('.linked-doc-popover')
  accessor linkedDocElement: Element | null = null;

  @property({ attribute: false })
  accessor options!: LinkedDocOptions;

  @property({ attribute: false })
  accessor triggerKey!: string;
}
