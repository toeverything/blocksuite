import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Disposable, Signal, Store, Text } from '@blocksuite/store';
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
  handleBlockSelectionBatchDelete,
  updateTextType,
  handleSelectAll,
  batchUpdateTextType,
  assertExists,
  isPageTitle,
  getSplicedTitle,
  noop,
} from '../../__internal__';
import { DefaultSelectionManager } from './selection-manager';
import { createLink } from '../../__internal__/rich-text/link-node';
import style from './style.css';

export interface DefaultPageSignals {
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

  selection!: DefaultSelectionManager;

  lastSelectionPosition: SelectionPosition = 'start';

  @property()
  mouseRoot!: HTMLElement;

  @state()
  selectionRect: DOMRect | null = null;

  @state()
  selectedRects: DOMRect[] = [];

  signals: DefaultPageSignals = {
    updateSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
  };

  private _scrollDisposable!: Disposable;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  private _title!: HTMLInputElement;

  private _bindHotkeys() {
    const { store } = this;
    const {
      UNDO,
      REDO,
      BACKSPACE,
      SELECT_ALL,
      INLINE_CODE,
      STRIKE,
      H1,
      H2,
      H3,
      H4,
      H5,
      H6,
      SHIFT_UP,
      SHIFT_DOWN,
      LINK,
    } = HOTKEYS;

    hotkey.addListener(UNDO, () => store.undo());
    hotkey.addListener(REDO, () => store.redo());

    hotkey.addListener(BACKSPACE, e => {
      const { state } = this.selection;
      if (isPageTitle(e)) {
        const target = e.target as HTMLInputElement;
        // range delete
        if (target.selectionStart !== target.selectionEnd) {
          e.preventDefault();
          const title = getSplicedTitle(target);
          store.updateBlock(this.model, { title });
        }
        // collapsed delete
        else {
          noop();
        }
        return;
      }

      if (state.type === 'native') {
        handleBackspace(store, e);
      } else if (state.type === 'block') {
        const { selectedRichTexts } = state;
        handleBlockSelectionBatchDelete(
          store,
          selectedRichTexts.map(richText => richText.model)
        );
        state.clear();
        this.signals.updateSelectedRects.emit([]);
      }
    });

    hotkey.addListener(SELECT_ALL, e => {
      e.preventDefault();
      handleSelectAll();
      this.selection.state.type = 'native';
    });

    hotkey.addListener(INLINE_CODE, e => handleFormat(store, e, 'code'));
    hotkey.addListener(STRIKE, e => handleFormat(store, e, 'strike'));
    hotkey.addListener(H1, () => this._updateType('h1', store));
    hotkey.addListener(H2, () => this._updateType('h2', store));
    hotkey.addListener(H3, () => this._updateType('h3', store));
    hotkey.addListener(H4, () => this._updateType('h4', store));
    hotkey.addListener(H5, () => this._updateType('h5', store));
    hotkey.addListener(H6, () => this._updateType('h6', store));

    hotkey.addListener(SHIFT_UP, e => {
      // TODO expand selection up
    });
    hotkey.addListener(SHIFT_DOWN, e => {
      // TODO expand selection down
    });
    hotkey.addListener(LINK, e => {
      e.preventDefault();
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
      HOTKEYS.SELECT_ALL,
      HOTKEYS.INLINE_CODE,
      HOTKEYS.STRIKE,
      HOTKEYS.H1,
      HOTKEYS.H2,
      HOTKEYS.H3,
      HOTKEYS.H4,
      HOTKEYS.H5,
      HOTKEYS.H6,
      HOTKEYS.SHIFT_UP,
      HOTKEYS.SHIFT_DOWN,
      HOTKEYS.LINK,
    ]);
  }

  private _onTitleKeyDown(e: KeyboardEvent) {
    const hasContent = !this.store.isEmpty;

    if (e.key === 'Enter' && hasContent) {
      assertExists(this._title.selectionStart);
      const titleCursorIndex = this._title.selectionStart;
      const contentLeft = this._title.value.slice(0, titleCursorIndex);
      const contentRight = this._title.value.slice(titleCursorIndex);

      const defaultGroup = this.model.children[0];
      const props = {
        flavour: 'paragraph',
        text: new Text(this.store, contentRight),
      };
      const newFirstParagraphId = this.store.addBlock(props, defaultGroup, 0);
      this.store.updateBlock(this.model, { title: contentLeft });
      asyncFocusRichText(this.store, newFirstParagraphId);
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      asyncFocusRichText(this.store, this.model.children[0].children[0].id);
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

  private _updateType(type: string, store: Store) {
    const { state } = this.selection;
    if (state.selectedRichTexts.length > 0) {
      batchUpdateTextType(
        store,
        state.selectedRichTexts.map(richText => richText.model),
        type
      );
    } else {
      updateTextType(type, store);
    }
  }

  private _clearSelection() {
    this.selection.state.clear();
    this.signals.updateSelectedRects.emit([]);
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this.selection = new DefaultSelectionManager(
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
      if (this.model.title !== this._title.value) {
        this._title.value = this.model.title || '';
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

    // TMP: clear selected rects on scroll
    const scrollContainer = this.mouseRoot.querySelector(
      '.affine-editor-container'
    ) as HTMLDivElement;
    const scrollSignal = Signal.fromEvent(scrollContainer, 'scroll');
    this._scrollDisposable = scrollSignal.on(() => this._clearSelection());

    focusTextEnd(this._title);
  }

  disconnectedCallback() {
    this._removeHotkeys();
    this._scrollDisposable.dispose();
    this.selection.dispose();
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
