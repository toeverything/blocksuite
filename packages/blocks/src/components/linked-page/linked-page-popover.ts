import type { Page } from '@blocksuite/store';
import {
  assertExists,
  type BaseBlockModel,
  DisposableGroup,
  type PageMeta,
} from '@blocksuite/store';
import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { REFERENCE_NODE } from '../../__internal__/rich-text/reference-node.js';
import type { AffineVEditor } from '../../__internal__/rich-text/virgo/types.js';
import {
  getRichTextByModel,
  getVirgoByModel,
} from '../../__internal__/utils/query.js';
import { isPrintableKeyEvent } from '../../__internal__/utils/std.js';
import { styles } from './styles.js';

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

@customElement('linked-page-popover')
export class LinkedPagePopover extends LitElement {
  static styles = styles;

  // @property()
  // model!: BaseBlockModel;

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

  private get _page() {
    return this.model.page;
  }

  private _disposables = new DisposableGroup();

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
    // TODO update and dispose
    let query = '';
    const keyDownListener = (e: KeyboardEvent) => {
      if (isPrintableKeyEvent(e)) {
        // TODO handle Backspace/Enter/ArrowUp/ArrowDown/...
        return;
      }
      query += e.key;
      this._updateQuery(query);
    };
    this._disposables.addFromEvent(richText, 'keydown', keyDownListener, {
      // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
    });
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    this._pageList = this._page.workspace.meta.pageMetas;
    this._disposables.add(
      this.model.page.workspace.slots.pagesUpdated.on(() => {
        // TODO filter by query
        this._pageList = this._page.workspace.meta.pageMetas;
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  updatePosition(position: { height: number; x: string; y: string }) {
    this._position = position;
  }

  private _updateQuery(str: string) {
    this._query = str;
  }

  private _insertLinkedNode(type: 'Subpage' | 'LinkedPage', pageId: string) {
    this.abortController.abort();
    const editor = getVirgoByModel(this.model);
    assertExists(editor, 'Editor not found');
    cleanSpecifiedTail(editor, '@' + this._query);
    const vRange = editor.getVRange();
    assertExists(vRange);
    editor.insertText(vRange, REFERENCE_NODE, { reference: { type, pageId } });
    editor.setVRange({
      index: vRange.index + 1,
      length: 0,
    });
  }

  private _createPage() {
    const pageName = this._query || DEFAULT_PAGE_NAME;
    const workspace = this._page.workspace;
    const id = workspace.idGenerator();
    const page = this._page.workspace.createPage(id);

    initDefaultBlocks(page, pageName);
    this._insertLinkedNode('LinkedPage', page.id);
  }

  private _createSubpage() {
    const pageName = this._query || DEFAULT_PAGE_NAME;
    const workspace = this._page.workspace;
    const id = workspace.idGenerator();
    const page = this._page.workspace.createPage(id, this._page.id);

    initDefaultBlocks(page, pageName);
    this._insertLinkedNode('Subpage', page.id);
  }

  render() {
    if (!this._position) return nothing;

    const MAX_HEIGHT = 396;
    const style = styleMap({
      transform: `translate(${this._position.x}, ${this._position.y})`,
      maxHeight: `${Math.min(this._position.height, MAX_HEIGHT)}px`,
    });

    const pageList = this._pageList.map(
      page => html`<icon-button
        width="280px"
        height="32px"
        @click=${() => {
          this._insertLinkedNode('LinkedPage', page.id);
        }}
        >${page.title}</icon-button
      >`
    );

    const pageName = this._query || DEFAULT_PAGE_NAME;
    return html`<div class="linked-page-popover" style="${style}">
      <div>Link to page</div>
      ${pageList}
      <div class="divider"></div>
      <div>New page</div>
      <icon-button width="280px" height="32px" @click=${this._createPage}
        >Create "${pageName}" page</icon-button
      >
      <icon-button width="280px" height="32px" @click=${this._createSubpage}
        >Create "${pageName}" subpage</icon-button
      >
    </div>`;
  }
}
