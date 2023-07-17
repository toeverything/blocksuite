import { WithDisposable } from '@blocksuite/lit';
import { assertExists, type BaseBlockModel } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getRichTextByModel } from '../../__internal__/utils/query.js';
import { cleanSpecifiedTail, createKeydownObserver } from '../utils.js';
import type { LinkedPageOptions } from './config.js';
import { type LinkedPageGroup } from './config.js';
import { styles } from './styles.js';

@customElement('affine-linked-page-popover')
export class LinkedPagePopover extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  options!: LinkedPageOptions;

  @state()
  private _position: {
    height: number;
    x: string;
    y: string;
  } | null = null;

  @state()
  private _query = '';

  @state()
  private _activatedItemIndex = 0;

  private _actionGroup: LinkedPageGroup[] = [];

  private get _flattenActionList() {
    return this._actionGroup
      .map(group =>
        group.items.map(item => ({ ...item, groupName: group.name }))
      )
      .flat();
  }

  private _updateActionList() {
    this._actionGroup = this.options.getMenus({
      query: this._query,
      page: this._page,
      model: this.model,
      pageMetas: this._page.workspace.meta.pageMetas,
    });
  }

  @query('.linked-page-popover')
  linkedPageElement?: Element;

  private get _page() {
    return this.model.page;
  }

  constructor(
    private model: BaseBlockModel,
    private abortController = new AbortController()
  ) {
    super();
  }

  override connectedCallback() {
    super.connectedCallback();
    const richText = getRichTextByModel(this.model);
    assertExists(richText, 'RichText not found');

    // init
    this._updateActionList();
    this._disposables.add(
      this.model.page.workspace.slots.pagesUpdated.on(() => {
        this._updateActionList();
      })
    );
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    createKeydownObserver({
      target: richText,
      onUpdateQuery: str => {
        this._query = str;
        this._activatedItemIndex = 0;
        this._updateActionList();
      },
      abortController: this.abortController,
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
        this.abortController.abort();
        cleanSpecifiedTail(this.model, '@' + this._query);
        this._flattenActionList[this._activatedItemIndex].action();
      },
      onEsc: () => {
        this.abortController.abort();
      },
    });
  }

  updatePosition(position: { height: number; x: string; y: string }) {
    this._position = position;
  }

  override render() {
    const MAX_HEIGHT = 396;
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
    return html`<div class="linked-page-popover" style="${style}">
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
                  ?hover=${this._activatedItemIndex === curIdx}
                  @click=${() => {
                    this.abortController.abort();
                    cleanSpecifiedTail(this.model, '@' + this._query);
                    action();
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
}
