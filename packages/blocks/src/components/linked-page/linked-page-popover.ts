import { WithDisposable } from '@blocksuite/lit';
import {
  assertExists,
  type BaseBlockModel,
  type PageMeta,
} from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getRichTextByModel } from '../../__internal__/utils/query.js';
import { cleanSpecifiedTail, createKeydownObserver } from '../utils.js';
import { getMenus, type LinkedPageItem } from './config.js';
import { styles } from './styles.js';

@customElement('affine-linked-page-popover')
export class LinkedPagePopover extends WithDisposable(LitElement) {
  static override styles = styles;

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

  private _actionList: LinkedPageItem[] = [];

  private _updateActionList(pageMetas: PageMeta[]) {
    this._actionList = getMenus({
      query: this._query,
      page: this._page,
      model: this.model,
      pageMetas,
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

    this._disposables.add(
      this.model.page.workspace.slots.pagesUpdated.on(() => {
        this._updateActionList(this._page.workspace.meta.pageMetas);
      })
    );
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    this._updateActionList(this._page.workspace.meta.pageMetas);
    createKeydownObserver({
      target: richText,
      onUpdateQuery: str => {
        this._query = str;
        this._activatedItemIndex = 0;
        this._updateActionList(this._page.workspace.meta.pageMetas);
      },
      abortController: this.abortController,
      onMove: step => {
        this._activatedItemIndex =
          (this._actionList.length + this._activatedItemIndex + step) %
          this._actionList.length;

        // Scroll to the active item
        const item = this._actionList[this._activatedItemIndex];
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
        this._actionList[this._activatedItemIndex].action();
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

    return html`<div class="linked-page-popover" style="${style}">
      ${this._actionList.map(
        ({ key, name, icon, groupName, action }, index) => {
          const showDivider =
            index !== 0 && this._actionList[index - 1].groupName !== groupName;
          return html`<div class="divider" ?hidden=${!showDivider}></div>
            <div class="group-title" ?hidden=${!showDivider && index !== 0}>
              ${groupName}
            </div>
            <icon-button
              width="280px"
              height="32px"
              data-id=${key}
              text=${name}
              ?hover=${this._activatedItemIndex === index}
              @click=${() => {
                this.abortController.abort();
                cleanSpecifiedTail(this.model, '@' + this._query);
                action();
              }}
              @mousemove=${() => {
                // Use `mousemove` instead of `mouseover` to avoid navigate conflict with keyboard
                this._activatedItemIndex = index;
              }}
              >${icon}</icon-button
            >`;
        }
      )}
    </div>`;
  }
}
