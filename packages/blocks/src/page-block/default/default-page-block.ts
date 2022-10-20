import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Signal, Store } from '@blocksuite/store';
import type { PageBlockModel } from '..';
import {
  type BlockHost,
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  hotkey,
  BlockChildrenContainer,
  SelectionPosition,
  HOTKEYS,
  handleBackspace,
  handleFormat,
  batchDelete,
  handleChangeType,
  handleSelectAll,
  batchChangeType,
} from '../../__internal__';
import { DefaultMouseManager } from './mouse-manager';
import style from './style.css';
import { createLink } from '../../__internal__/rich-text/link-node';

export interface DefaultPageBlockSignals {
  updateSelectionRect: Signal<DOMRect | null>;
  updateSelectedRects: Signal<DOMRect[]>;
}

// https://stackoverflow.com/a/2345915
function focusTextEnd(input: HTMLInputElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}

function SelectionRect(rect: DOMRect | null) {
  if (rect === null) return html``;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-page-selection-rect {
        position: fixed;
        background: var(--affine-selected-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div class="affine-page-selection-rect" style=${styleMap(style)}></div>
  `;
}

function SelectedRectsContainer(rects: DOMRect[]) {
  return html`
    <style>
      .affine-page-selected-rects-container > div {
        position: fixed;
        background: rgba(104, 128, 255, 0.1);
        z-index: 1;
        pointer-events: none;
        border-radius: 5px;
      }
    </style>
    <div class="affine-page-selected-rects-container">
      ${rects.map(rect => {
        const style = {
          display: 'block',
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
        };
        return html`<div style=${styleMap(style)}></div>`;
      })}
    </div>
  `;
}

@customElement('default-page-block')
export class DefaultPageBlockComponent extends LitElement implements BlockHost {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  store!: Store;

  flavour = 'page' as const;

  mouse!: DefaultMouseManager;

  lastSelectionPosition: SelectionPosition = 'start';

  @property()
  mouseRoot!: HTMLElement;

  @state()
  selectionRect: DOMRect | null = null;

  @state()
  selectedRects: DOMRect[] = [];

  signals: DefaultPageBlockSignals = {
    updateSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
  };

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  _blockTitle!: HTMLInputElement;

  private _bindHotkeys() {
    const { store } = this;

    hotkey.addListener(HOTKEYS.UNDO, () => store.undo());
    hotkey.addListener(HOTKEYS.REDO, () => store.redo());

    hotkey.addListener(HOTKEYS.BACKSPACE, e => {
      const { selection } = this.mouse;
      if (selection.type === 'native') {
        handleBackspace(store, e);
      } else if (selection.type === 'block') {
        const { selectedRichTexts } = selection;
        batchDelete(
          store,
          selectedRichTexts.map(richText => richText.model)
        );
        selection.clear();
        this.signals.updateSelectedRects.emit([]);
      }
    });
    hotkey.addListener(HOTKEYS.SELECT_ALL, e => {
      e.preventDefault();
      const { selection } = this.mouse;
      handleSelectAll();
      selection.type = 'native'
    });
    hotkey.addListener(HOTKEYS.INLINE_CODE, e => {
      handleFormat(store, e, 'code');
    });
    hotkey.addListener(HOTKEYS.STRIKE, e => {
      handleFormat(store, e, 'strike');
    });
    hotkey.addListener(HOTKEYS.H1, e => {
      // handleFormat(store, e, 'header');
      this._changeType('h1', store,);
    });
    hotkey.addListener(HOTKEYS.H2, e => {
      // handleFormat(store, e, 'header');

      this._changeType('h2', store);
    });
    hotkey.addListener(HOTKEYS.H3, e => {
      // handleFormat(store, e, 'header');

      this._changeType('h3', store);
    });
    hotkey.addListener(HOTKEYS.H4, e => {
      // handleFormat(store, e, 'header');

      this._changeType('h4', store);
    });
    hotkey.addListener(HOTKEYS.H5, e => {
      // handleFormat(store, e, 'header');

      this._changeType('h5', store);
    });
    hotkey.addListener(HOTKEYS.H6, e => {
      // handleFormat(store, e, 'header');

      this._changeType('h6', store);
    });
    hotkey.addListener(HOTKEYS.SHIFT_UP, e => {
      // TODO expand selection up
    });
    hotkey.addListener(HOTKEYS.SHIFT_DOWN, e => {
      // TODO expand selection down
    });
    hotkey.addListener(HOTKEYS.LINK, e => {
      createLink(store, e);
    });

    // !!!
    // Don't forget to remove hotkeys at `_removeHotkeys`
  }

  private _removeHotkeys() {
    hotkey.removeListener([
      HOTKEYS.UNDO,
      HOTKEYS.REDO,
      HOTKEYS.BACKSPACE,
      HOTKEYS.INLINE_CODE,
      HOTKEYS.STRIKE,
      HOTKEYS.SHIFT_UP,
      HOTKEYS.SHIFT_DOWN,
      HOTKEYS.LINK,
      HOTKEYS.H1,
      HOTKEYS.H2,
      HOTKEYS.H3,
      HOTKEYS.H4,
      HOTKEYS.H5,
      HOTKEYS.H6,
      HOTKEYS.SELECT_ALL,
    ]);
  }

  private _onTitleKeyDown(e: KeyboardEvent) {
    const hasContent = this._blockTitle.value.length > 0;

    if (e.key === 'Enter' && hasContent) {
      const defaultGroup = this.model.children[0];
      const firstParagraph = defaultGroup.children[0];
      asyncFocusRichText(this.store, firstParagraph.id);
    }
  }

  private _onTitleInput(e: InputEvent) {
    const { store } = this;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      const pageId = store.addBlock({ flavour: 'page', title });
      const groupId = store.addBlock({ flavour: 'group' }, pageId);
      store.addBlock({ flavour: 'paragraph' }, groupId);
      return;
    }

    const title = (e.target as HTMLInputElement).value;
    store.updateBlock(this.model, { title });
  }
  private _changeType(type: string,store:Store) {
    const { selection } = this.mouse;
      if (selection.selectedRichTexts.length > 0) {
        batchChangeType(store, selection.selectedRichTexts.map(richText => richText.model), type);
      }else{
        handleChangeType(type, store);
      }
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this.mouse = new DefaultMouseManager(
        this.store,
        this.mouseRoot,
        this.signals
      );
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    this._bindHotkeys();

    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._blockTitle.value) {
        this._blockTitle.value = this.model.title || '';
        this.requestUpdate();
      }
    });

    this.signals.updateSelectionRect.on(rect => {
      this.selectionRect = rect;
      this.requestUpdate();
    });
    this.signals.updateSelectedRects.on(rects => {
      this.selectedRects = rects;
      this.requestUpdate();
    });

    focusTextEnd(this._blockTitle);
  }

  disconnectedCallback() {
    this._removeHotkeys();
    this.mouse.dispose();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this);
    const selectionRect = SelectionRect(this.selectionRect);
    const selectedRectsContainer = SelectedRectsContainer(this.selectedRects);

    return html`
      <div class="affine-default-page-block-container">
        <div class="affine-default-page-block-title-container">
          <input
            placeholder="Title"
            class="affine-default-page-block-title"
            value=${this.model.title}
            @keydown=${this._onTitleKeyDown}
            @input=${this._onTitleInput}
          />
        </div>
        ${childrenContainer} ${selectedRectsContainer} ${selectionRect}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-page-block': DefaultPageBlockComponent;
  }
}
