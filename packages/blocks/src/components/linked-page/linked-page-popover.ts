import { WithDisposable } from '@blocksuite/blocks/std';
import { DualLinkIcon, NewPageIcon, PageIcon } from '@blocksuite/global/config';
import type { Page } from '@blocksuite/store';
import {
  assertExists,
  type BaseBlockModel,
  type PageMeta,
} from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { REFERENCE_NODE } from '../../__internal__/rich-text/reference-node.js';
import type { AffineVEditor } from '../../__internal__/rich-text/virgo/types.js';
import {
  getRichTextByModel,
  getVirgoByModel,
} from '../../__internal__/utils/query.js';
import {
  isControlledKeyboardEvent,
  isFuzzyMatch,
  isPrintableKeyEvent,
} from '../../__internal__/utils/std.js';
import { styles } from './styles.js';

/**
 * Remove specified text from the current range.
 */
function cleanSpecifiedTail(vEditor: AffineVEditor, str: string) {
  const vRange = vEditor.getVRange();
  assertExists(vRange);
  const idx = vRange.index - str.length;
  const textStr = vEditor.yText.toString().slice(idx, idx + str.length);
  if (textStr !== str) {
    console.warn(
      `Failed to clean text! Text mismatch expected: ${str} but actual: ${textStr}`
    );
    return;
  }
  vEditor.deleteText({ index: idx, length: str.length });
  vEditor.setVRange({
    index: idx,
    length: 0,
  });
}

function initDefaultBlocks(page: Page, pageName: string) {
  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text(pageName),
  });
  page.addBlock('affine:surface', {}, null);
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock('affine:paragraph', {}, frameId);
}

const DEFAULT_PAGE_NAME = 'Untitled';

const createKeydownObserver = ({
  target,
  onUpdateQuery,
  onMove,
  onConfirm,
  onEsc,
  ignoreKeys = [],
  abortController,
}: {
  target: HTMLElement;
  onUpdateQuery: (val: string) => void;
  onMove: (step: 1 | -1) => void;
  onConfirm: () => void;
  onEsc?: () => void;
  ignoreKeys?: string[];
  abortController: AbortController;
}) => {
  let query = '';
  const keyDownListener = (e: KeyboardEvent) => {
    if (ignoreKeys.includes(e.key)) {
      return;
    }

    e.stopPropagation();
    if (
      // Abort when press modifier key to avoid weird behavior
      // e.g. press ctrl + a to select all or press ctrl + v to paste
      isControlledKeyboardEvent(e) ||
      e.key === 'Escape'
    ) {
      abortController.abort();
      return;
    }

    if (!isPrintableKeyEvent(e)) {
      switch (e.key) {
        case 'Backspace': {
          if (!query.length) {
            abortController.abort();
          }
          query = query.slice(0, -1);
          onUpdateQuery(query);
          return;
        }
        case 'Enter': {
          if (e.isComposing) {
            return;
          }
          onConfirm();
          e.preventDefault();
          return;
        }
        case 'Tab': {
          if (e.shiftKey) {
            onMove(-1);
          } else {
            onMove(1);
          }
          e.preventDefault();
          return;
        }
        case 'ArrowUp': {
          onMove(-1);
          e.preventDefault();
          return;
        }
        case 'ArrowDown': {
          onMove(1);
          e.preventDefault();
          return;
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          abortController.abort();
          return;
        }
        default:
          // Other control keys
          return;
      }
    }
    query += e.key;
    onUpdateQuery(query);
  };

  target.addEventListener('keydown', keyDownListener, {
    // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
    capture: true,
  });
  abortController.signal.addEventListener('abort', () => {
    target.removeEventListener('keydown', keyDownListener, { capture: true });
  });

  if (onEsc) {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEsc();
      }
    };
    window.addEventListener('keydown', escListener);
    abortController.signal.addEventListener('abort', () =>
      window.removeEventListener('keydown', escListener)
    );
  }
};

@customElement('affine-linked-page-popover')
export class LinkedPagePopover extends WithDisposable(LitElement) {
  static styles = styles;

  @state()
  private _position: {
    height: number;
    x: string;
    y: string;
  } | null = null;

  @state()
  private _query = '';

  @state()
  private _pageList: PageMeta[] = [];

  @state()
  private _activatedItemIndex = 0;

  private get _actionList() {
    const DISPLAY_LENGTH = 8;
    const pageName = this._query || DEFAULT_PAGE_NAME;
    const displayPageName =
      pageName.slice(0, DISPLAY_LENGTH) +
      (pageName.length > DISPLAY_LENGTH ? '..' : '');
    const filteredPageList = this._pageList.filter(({ title }) =>
      isFuzzyMatch(title, this._query)
    );

    return [
      ...filteredPageList.map((page, idx) => ({
        key: page.id,
        name: page.title || DEFAULT_PAGE_NAME,
        active: idx === this._activatedItemIndex,
        icon: PageIcon,
        action: () => this._insertLinkedNode('LinkedPage', page.id),
      })),
      // The active condition is a bit tricky here
      {
        key: 'create-linked-page',
        name: `Create "${displayPageName}" page`,
        active: filteredPageList.length === this._activatedItemIndex,
        icon: NewPageIcon,
        action: () => this._createPage(),
      },
      {
        key: 'create-subpage',
        name: `Create "${displayPageName}" subpage`,
        active: filteredPageList.length + 1 === this._activatedItemIndex,
        icon: DualLinkIcon,
        action: () => this._createSubpage(),
      },
    ];
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

  connectedCallback() {
    super.connectedCallback();
    const richText = getRichTextByModel(this.model);
    assertExists(richText, 'RichText not found');

    createKeydownObserver({
      target: richText,
      onUpdateQuery: str => this._updateQuery(str),
      abortController: this.abortController,
      onMove: step => {
        this._activatedItemIndex =
          (this._actionList.length + this._activatedItemIndex + step) %
          this._actionList.length;

        // Scroll to the active item
        const item = this._actionList[this._activatedItemIndex];
        if (
          item.key === 'create-linked-page' ||
          item.key === 'create-subpage'
        ) {
          return;
        }
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
        this._actionList[this._activatedItemIndex].action();
      },
      onEsc: () => {
        this.abortController.abort();
      },
    });
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    this._pageList = this._page.workspace.meta.pageMetas;
    this._disposables.add(
      this.model.page.workspace.slots.pagesUpdated.on(() => {
        this._pageList = this._page.workspace.meta.pageMetas;
      })
    );
  }

  updatePosition(position: { height: number; x: string; y: string }) {
    this._position = position;
  }

  private _updateQuery(str: string) {
    this._query = str;
    this._activatedItemIndex = 0;
  }

  private _insertLinkedNode(type: 'Subpage' | 'LinkedPage', pageId: string) {
    this.abortController.abort();
    const vEditor = getVirgoByModel(this.model);
    assertExists(vEditor, 'Editor not found');
    cleanSpecifiedTail(vEditor, '@' + this._query);
    const vRange = vEditor.getVRange();
    assertExists(vRange);
    vEditor.insertText(vRange, REFERENCE_NODE, { reference: { type, pageId } });
    vEditor.setVRange({
      index: vRange.index + 1,
      length: 0,
    });
  }

  private _createPage() {
    const pageName = this._query;
    const workspace = this._page.workspace;
    const id = workspace.idGenerator();
    const page = this._page.workspace.createPage(id);

    initDefaultBlocks(page, pageName);
    this._insertLinkedNode('LinkedPage', page.id);
  }

  private _createSubpage() {
    const pageName = this._query;
    const workspace = this._page.workspace;
    const id = workspace.idGenerator();
    const page = this._page.workspace.createPage(id, this._page.id);

    initDefaultBlocks(page, pageName);
    this._insertLinkedNode('Subpage', page.id);
  }

  render() {
    const MAX_HEIGHT = 396;
    const style = this._position
      ? styleMap({
          transform: `translate(${this._position.x}, ${this._position.y})`,
          maxHeight: `${Math.min(this._position.height, MAX_HEIGHT)}px`,
        })
      : styleMap({
          visibility: 'hidden',
        });

    const pageList = this._actionList.slice(0, -2).map(
      ({ key, name, action, active, icon }, index) => html`<icon-button
        width="280px"
        height="32px"
        data-id=${key}
        text=${name}
        ?hover=${active}
        @click=${action}
        @mousemove=${() => {
          // Use `mousemove` instead of `mouseover` to avoid navigate conflict with keyboard
          this._activatedItemIndex = index;
        }}
        >${icon}</icon-button
      >`
    );

    const createList = this._actionList.slice(-2).map(
      ({ key, name, action, active, icon }, index) => html`<icon-button
        width="280px"
        height="32px"
        data-id=${key}
        text=${name}
        ?hover=${active}
        @click=${action}
        @mousemove=${() => {
          // Use `mousemove` instead of `mouseover` to avoid navigate conflict with keyboard
          this._activatedItemIndex = this._actionList.length - 2 + index;
        }}
        >${icon}</icon-button
      >`
    );

    return html`<div class="linked-page-popover" style="${style}">
      ${pageList.length
        ? html`<div class="group-title">Link to page</div>
            <div class="group" style="overflow-y: scroll; max-height: 224px;">
              ${pageList}
            </div>
            <div class="divider"></div>`
        : null}

      <div class="group-title">New page</div>
      ${createList}
    </div>`;
  }
}
