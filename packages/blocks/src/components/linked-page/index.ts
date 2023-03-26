import {
  assertExists,
  type BaseBlockModel,
  DisposableGroup,
  type PageMeta,
} from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { REFERENCE_NODE } from '../../__internal__/rich-text/reference-node.js';
import type { AffineVEditor } from '../../__internal__/rich-text/virgo/types.js';
import {
  getRichTextByModel,
  getViewportElement,
  getVirgoByModel,
} from '../../__internal__/utils/query.js';
import { isPrintableKeyEvent, throttle } from '../../__internal__/utils/std.js';
import { getPopperPosition } from '../../page-block/utils/position.js';

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

const styles = css`
  :host {
    position: absolute;
  }

  .linked-page-popover {
    position: fixed;
    left: 0;
    top: 0;
    box-sizing: border-box;
    font-size: var(--affine-font-base);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0 10px 10px 10px;
    z-index: var(--affine-z-index-popover);
  }
`;

const DEFAULT_PAGE_NAME = 'Untitled';

@customElement('linked-page-popover')
class LinkedPagePopover extends LitElement {
  static styles = styles;

  // @property()
  // model!: BaseBlockModel;

  @state()
  private position: {
    height: number;
    x: string;
    y: string;
  } | null = null;

  @state()
  private query = '';

  @state()
  private pageList: PageMeta[] = [];

  get page() {
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
    // TODO update and dispose
    let query = '';
    const disposableGroup = new DisposableGroup();
    const keyDownListener = (e: KeyboardEvent) => {
      if (isPrintableKeyEvent(e)) {
        // TODO handle Backspace/Enter/ArrowUp/ArrowDown/...
        return;
      }
      query += e.key;
      this.updateQuery(query);
    };
    disposableGroup.addFromEvent(richText, 'keydown', keyDownListener, {
      // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
    });
    disposableGroup.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    this.pageList = this.page.workspace.meta.pageMetas;
    disposableGroup.add(
      this.model.page.workspace.slots.pagesUpdated.on(() => {
        // TODO filter by query
        this.pageList = this.page.workspace.meta.pageMetas;
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // TODO dispose
  }

  updatePosition(position: { height: number; x: string; y: string }) {
    this.position = position;
  }

  private updateQuery(str: string) {
    this.query = str;
  }

  private insertLinkedNode(type: 'Subpage' | 'LinkedPage', pageId: string) {
    this.abortController.abort();
    const editor = getVirgoByModel(this.model);
    assertExists(editor, 'Editor not found');
    cleanSpecifiedTail(editor, '@' + this.query);
    const vRange = editor.getVRange();
    assertExists(vRange);
    editor.insertText(vRange, REFERENCE_NODE, { reference: { type, pageId } });
    editor.setVRange({
      index: vRange.index + 1,
      length: 0,
    });
  }

  private onCreatePage() {
    const pageName = this.query || DEFAULT_PAGE_NAME;
    const workspace = this.page.workspace;
    const id = workspace.idGenerator();
    const newPage = this.page.workspace.createPage(id);
    newPage.addBlock('affine:page', {
      title: new newPage.Text(pageName),
    });
    this.insertLinkedNode('LinkedPage', newPage.id);
  }

  private onCreateSubpage() {
    const pageName = this.query || DEFAULT_PAGE_NAME;
    const workspace = this.page.workspace;
    const id = workspace.idGenerator();
    const newPage = this.page.workspace.createPage(id, this.page.id);
    newPage.addBlock('affine:page', {
      title: new newPage.Text(pageName),
    });
    this.insertLinkedNode('Subpage', newPage.id);
  }

  render() {
    if (!this.position) return nothing;

    const MAX_HEIGHT = 396;
    const style = styleMap({
      transform: `translate(${this.position.x}, ${this.position.y})`,
      maxHeight: `${Math.min(this.position.height, MAX_HEIGHT)}px`,
    });

    const pageList = this.pageList.map(
      page => html`<icon-button
        width="280px"
        height="32px"
        @click=${() => {
          this.insertLinkedNode('LinkedPage', page.id);
        }}
        >${page.title}</icon-button
      >`
    );

    const pageName = this.query || DEFAULT_PAGE_NAME;
    return html`<div class="linked-page-popover" style="${style}">
      <div>Link to page</div>
      ${pageList}
      <div class="divider"></div>
      <div>New page</div>
      <icon-button width="280px" height="32px" @click=${this.onCreatePage}
        >Create "${pageName}" page</icon-button
      >
      <icon-button width="280px" height="32px" @click=${this.onCreateSubpage}
        >Create "${pageName}" subpage</icon-button
      >
    </div>`;
  }
}

export function showLinkedPagePopover({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
}: {
  model: BaseBlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  const disposableGroup = new DisposableGroup();
  abortController.signal.addEventListener('abort', e => {
    disposableGroup.dispose();
  });

  const linkedPage = new LinkedPagePopover(model, abortController);
  // Mount
  container.appendChild(linkedPage);
  disposableGroup.add(() => {
    linkedPage.remove();
  });

  // Handle position
  const updatePosition = throttle(() => {
    const position = getPopperPosition(linkedPage, range);
    linkedPage.updatePosition(position);
  }, 10);
  disposableGroup.addFromEvent(window, 'resize', updatePosition);
  const scrollContainer = getViewportElement(model.page);
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    disposableGroup.addFromEvent(scrollContainer, 'scroll', updatePosition, {
      passive: true,
    });
  }

  // Wait for node to be mounted
  setTimeout(updatePosition);

  disposableGroup.addFromEvent(window, 'mousedown', (e: Event) => {
    if (e.target === linkedPage) return;
    abortController.abort();
  });

  return linkedPage;
}
