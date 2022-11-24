/// <reference types="vite/client" />
import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Disposable, Signal, Space, Text } from '@blocksuite/store';
import type { PageBlockModel } from '..';
import {
  type BlockHost,
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  hotkey,
  BlockChildrenContainer,
  SelectionPosition,
  HOTKEYS,
  assertExists,
  isPageTitle,
  getSplicedTitle,
  noop,
} from '../../__internal__';
import { DefaultSelectionManager } from './selection-manager';
import {
  batchUpdateTextType,
  bindCommonHotkey,
  handleBackspace,
  handleBlockSelectionBatchDelete,
  handleSelectAll,
  removeCommonHotKey,
  tryUpdateGroupSize,
  updateTextType,
} from '../utils';
import style from './style.css';

export interface DefaultPageSignals {
  updateFrameSelectionRect: Signal<DOMRect | null>;
  updateSelectedRects: Signal<DOMRect[]>;
}

// https://stackoverflow.com/a/2345915
function focusTextEnd(input: HTMLInputElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}

function FrameSelectionRect(rect: DOMRect | null) {
  if (rect === null) return html``;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-page-frame-selection-rect {
        position: absolute;
        background: var(--affine-selected-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div
      class="affine-page-frame-selection-rect"
      style=${styleMap(style)}
    ></div>
  `;
}

function SelectedRectsContainer(rects: DOMRect[]) {
  return html`
    <style>
      .affine-page-selected-rects-container > div {
        position: fixed;
        background: var(--affine-selected-color);
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
  space!: Space;

  flavour = 'affine:page' as const;

  selection!: DefaultSelectionManager;

  lastSelectionPosition: SelectionPosition = 'start';

  @property()
  mouseRoot!: HTMLElement;

  @state()
  frameSelectionRect: DOMRect | null = null;

  @state()
  selectedRects: DOMRect[] = [];

  signals: DefaultPageSignals = {
    updateFrameSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
  };

  private _scrollDisposable!: Disposable;

  public isCompositionStart = false;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  private _title!: HTMLInputElement;

  private _bindHotkeys() {
    const { space } = this;
    const {
      BACKSPACE,
      SELECT_ALL,
      H1,
      H2,
      H3,
      H4,
      H5,
      H6,
      SHIFT_UP,
      SHIFT_DOWN,
      NUMBERED_LIST,
      BULLETED,
      TEXT,
    } = HOTKEYS;

    bindCommonHotkey(space);
    hotkey.addListener(BACKSPACE, e => {
      const { state } = this.selection;
      if (isPageTitle(e)) {
        const target = e.target as HTMLInputElement;
        // range delete
        if (target.selectionStart !== target.selectionEnd) {
          e.preventDefault();
          const title = getSplicedTitle(target);
          space.updateBlock(this.model, { title });
        }
        // collapsed delete
        else {
          noop();
        }
        return;
      }

      if (state.type === 'native') {
        handleBackspace(space, e);
      } else if (state.type === 'block') {
        const { selectedRichTexts } = state;
        handleBlockSelectionBatchDelete(
          space,
          selectedRichTexts.map(richText => richText.model)
        );
        state.clear();
        this.signals.updateSelectedRects.emit([]);
      }
    });

    hotkey.addListener(SELECT_ALL, e => {
      // console.log('e: ', e);
      e.preventDefault();
      handleSelectAll();
      this.selection.state.type = 'native';
    });

    hotkey.addListener(H1, () =>
      this._updateType('affine:paragraph', 'h1', space)
    );
    hotkey.addListener(H2, () =>
      this._updateType('affine:paragraph', 'h2', space)
    );
    hotkey.addListener(H3, () =>
      this._updateType('affine:paragraph', 'h3', space)
    );
    hotkey.addListener(H4, () =>
      this._updateType('affine:paragraph', 'h4', space)
    );
    hotkey.addListener(H5, () =>
      this._updateType('affine:paragraph', 'h5', space)
    );
    hotkey.addListener(H6, () =>
      this._updateType('affine:paragraph', 'h6', space)
    );
    hotkey.addListener(NUMBERED_LIST, () =>
      this._updateType('affine:list', 'numbered', space)
    );
    hotkey.addListener(BULLETED, () =>
      this._updateType('affine:list', 'bulleted', space)
    );
    hotkey.addListener(TEXT, () =>
      this._updateType('affine:paragraph', 'text', space)
    );
    hotkey.addListener(SHIFT_UP, e => {
      // TODO expand selection up
    });
    hotkey.addListener(SHIFT_DOWN, e => {
      // TODO expand selection down
    });

    // !!!
    // Don't forget to remove hotkeys at `_removeHotkeys`
  }

  private _removeHotkeys() {
    removeCommonHotKey();
    hotkey.removeListener([
      HOTKEYS.BACKSPACE,
      HOTKEYS.SELECT_ALL,
      HOTKEYS.H1,
      HOTKEYS.H2,
      HOTKEYS.H3,
      HOTKEYS.H4,
      HOTKEYS.H5,
      HOTKEYS.H6,
      HOTKEYS.SHIFT_UP,
      HOTKEYS.SHIFT_DOWN,
      HOTKEYS.BULLETED,
      HOTKEYS.NUMBERED_LIST,
      HOTKEYS.TEXT,
    ]);
  }

  private _onTitleKeyDown(e: KeyboardEvent) {
    const hasContent = !this.space.isEmpty;

    if (e.key === 'Enter' && hasContent) {
      assertExists(this._title.selectionStart);
      const titleCursorIndex = this._title.selectionStart;
      const contentLeft = this._title.value.slice(0, titleCursorIndex);
      const contentRight = this._title.value.slice(titleCursorIndex);

      const defaultGroup = this.model.children[0];
      const props = {
        flavour: 'affine:paragraph',
        text: new Text(this.space, contentRight),
      };
      const newFirstParagraphId = this.space.addBlock(props, defaultGroup, 0);
      this.space.updateBlock(this.model, { title: contentLeft });
      asyncFocusRichText(this.space, newFirstParagraphId);
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      asyncFocusRichText(this.space, this.model.children[0].children[0].id);
    }
  }

  private _onTitleInput(e: InputEvent) {
    const { space } = this;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      const pageId = space.addBlock({ flavour: 'affine:page', title });
      const groupId = space.addBlock({ flavour: 'affine:group' }, pageId);
      space.addBlock({ flavour: 'affine:paragraph' }, groupId);
      return;
    }

    const title = (e.target as HTMLInputElement).value;
    space.updateBlock(this.model, { title });
  }

  private _updateType(flavour: string, type: string, space: Space) {
    const { state } = this.selection;
    if (state.selectedRichTexts.length > 0) {
      batchUpdateTextType(
        flavour,
        space,
        state.selectedRichTexts.map(richText => richText.model),
        type
      );
    } else {
      updateTextType(flavour, type, space);
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
    if (changedProperties.has('mouseRoot') && changedProperties.has('space')) {
      this.selection = new DefaultSelectionManager(
        this.space,
        this.mouseRoot,
        this.signals
      );
    }
    super.update(changedProperties);
  }

  private _handleCompositionStart = () => {
    this.isCompositionStart = true;
  };

  private _handleCompositionEnd = () => {
    this.isCompositionStart = false;
  };

  firstUpdated() {
    this._bindHotkeys();
    hotkey.enableHotkey();
    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._title.value) {
        this._title.value = this.model.title || '';
        this.requestUpdate();
      }
    });

    this.signals.updateFrameSelectionRect.on(rect => {
      this.frameSelectionRect = rect;
      this.requestUpdate();
    });
    this.signals.updateSelectedRects.on(rects => {
      this.selectedRects = rects;
      this.requestUpdate();
    });

    tryUpdateGroupSize(this.space, 1);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateGroupSize(this.space, 1);
    });

    // TMP: clear selected rects on scroll
    const scrollContainer = this.mouseRoot.querySelector(
      '.affine-default-viewport'
    ) as HTMLDivElement;
    const scrollSignal = Signal.fromEvent(scrollContainer, 'scroll');
    this._scrollDisposable = scrollSignal.on(() => this._clearSelection());
    window.addEventListener('compositionstart', this._handleCompositionStart);
    window.addEventListener('compositionend', this._handleCompositionEnd);

    focusTextEnd(this._title);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this._removeHotkeys();
    this._scrollDisposable.dispose();
    this.selection.dispose();
    window.removeEventListener(
      'compositionstart',
      this._handleCompositionStart
    );
    window.removeEventListener('compositionend', this._handleCompositionEnd);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this);
    const selectionRect = FrameSelectionRect(this.frameSelectionRect);
    const selectedRectsContainer = SelectedRectsContainer(this.selectedRects);

    return html`
      <div class="affine-default-viewport">
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
          ${childrenContainer}
        </div>
        ${selectionRect} ${selectedRectsContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-page-block': DefaultPageBlockComponent;
  }
}
