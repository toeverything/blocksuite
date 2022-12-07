/// <reference types="vite/client" />
import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  Disposable,
  Signal,
  Page,
  Text,
  BaseBlockModel,
} from '@blocksuite/store';
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
  getModelByElement,
  matchFlavours,
  focusPreviousBlock,
  getDefaultPageBlock,
  getBlockElementByModel,
  getContainerByModel,
  getPreviousBlock,
  getNextBlock,
  focusNextBlock,
  resetNativeSelection,
  getModelsByRange,
  Point,
  caretRangeFromPoint,
  getStartModelBySelection,
  getPreviousSiblingById,
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
import { CaptionIcon, CopyIcon, DeleteIcon, DownloadIcon } from '../icons';
import {
  downloadImage,
  focusCaption,
  copyImgToClip,
  NON_TEXT_ARR,
} from './utils';
import { isAtLineEdge } from '../../__internal__/rich-text/rich-text-operations';
export interface EmbedOption {
  position: { x: number; y: number };
  model: BaseBlockModel;
}
export interface DefaultPageSignals {
  updateFrameSelectionRect: Signal<DOMRect | null>;
  updateSelectedRects: Signal<DOMRect[]>;
  updateEmbedRects: Signal<
    { left: number; top: number; width: number; height: number }[]
  >;
  updateEmbedOption: Signal<EmbedOption | null>;
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

function EmbedSelectedRectsContainer(
  rects: { left: number; top: number; width: number; height: number }[]
) {
  return html`
    <style>
      .affine-page-selected-embed-rects-container > div {
        position: fixed;
        border: 3px solid #4286f4;
      }
    </style>
    <div class="affine-page-selected-embed-rects-container resizable">
      ${rects.map(rect => {
        const style = {
          display: 'block',
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
        };
        return html`<div class="resizes" style=${styleMap(style)}>
          <div class="resize top-left"></div>
          <div class="resize top-right"></div>
          <div class="resize bottom-left"></div>
          <div class="resize bottom-right"></div>
        </div>`;
      })}
    </div>
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

function EmbedOptionContainer(
  embedOption: EmbedOption | null,
  signals: DefaultPageSignals
) {
  if (embedOption) {
    const style = {
      left: embedOption.position.x + 'px',
      top: embedOption.position.y + 'px',
    };
    return html`
      <style>
        .affine-image-option-container > ul {
          position: fixed;
          z-index: 1;
        }
      </style>

      <div class="affine-image-option-container">
        <ul style=${styleMap(style)} class="image-option">
          <li @click=${() => focusCaption(embedOption.model)}>
            ${CaptionIcon}
          </li>
          <li
            @click=${() => {
              assertExists(embedOption.model.source);
              downloadImage(embedOption.model.source);
            }}
          >
            ${DownloadIcon}
          </li>
          <li
            @click=${() => {
              assertExists(embedOption.model.source);
              copyImgToClip(embedOption.model.source);
            }}
          >
            ${CopyIcon}
          </li>
          <li
            @click=${() => {
              embedOption.model.page.deleteBlock(embedOption.model);
              signals.updateEmbedRects.emit([]);
            }}
          >
            ${DeleteIcon}
          </li>
        </ul>
      </div>
    `;
  } else {
    return html``;
  }
}

function handleUp(
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals
) {
  const nativeSelection = window.getSelection();
  if (nativeSelection?.anchorNode) {
    const model = getStartModelBySelection();
    const activeContainer = getContainerByModel(model);
    const activePreNodeModel = getPreviousBlock(activeContainer, model.id);
    const editableContainer = getBlockElementByModel(model)?.querySelector(
      '.ql-editor'
    ) as HTMLElement;
    const range = nativeSelection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();

    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      // FIXME: Then it will turn the input into the div
      if (
        activePreNodeModel &&
        matchFlavours(activePreNodeModel, ['affine:group'])
      ) {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLInputElement
        ).focus();
      }
      // else if (
      //   activePreNodeModel &&
      //   NON_TEXT_ARR.includes(activePreNodeModel.type)
      // ) {
      //   const pageBlock = getDefaultPageBlock(model);
      //   pageBlock.selection.state.type = 'block';
      //   const dividerBlockElement = getBlockElementByModel(
      //     activePreNodeModel
      //   ) as HTMLElement;
      //   const selectionRect = dividerBlockElement.getBoundingClientRect();
      //   pageBlock.signals.updateSelectedRects.emit([selectionRect]);
      //   pageBlock.selection.state.selectedBlocks.push(dividerBlockElement);
      //   resetNativeSelection(null);
      // }
      else {
        focusPreviousBlock(model, new Point(left, top));
      }
    }
  } else {
    signals.updateSelectedRects.emit([]);
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const container = getContainerByModel(selectedModel);
    const preNodeModel = getPreviousBlock(container, selectedModel.id);
    assertExists(preNodeModel);
    if (
      matchFlavours(preNodeModel, ['affine:list']) ||
      matchFlavours(preNodeModel, ['affine:paragraph'])
    ) {
      focusPreviousBlock(selectedModel, 'end');
      state.clear();
      return;
    } else if (NON_TEXT_ARR.includes(selectedModel.type)) {
      const preNodeElement = getBlockElementByModel(preNodeModel);
      assertExists(preNodeElement);
      state.selectedBlocks.push(preNodeElement);
      signals.updateSelectedRects.emit([
        preNodeElement.getBoundingClientRect(),
      ]);
    }
  }
}
function handleDown(
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals
) {
  const nativeSelection = window.getSelection();
  if (nativeSelection?.anchorNode) {
    const model = getStartModelBySelection();
    // const activeContainer = getContainerByModel(model);
    const activePreNodeModel = getNextBlock(model.id);

    const editableContainer = getBlockElementByModel(model)?.querySelector(
      '.ql-editor'
    ) as HTMLElement;
    const range = nativeSelection.getRangeAt(0);
    const { height, left, bottom } = range.getBoundingClientRect();

    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, bottom + height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      // FIXME: Then it will turn the input into the div
      if (
        activePreNodeModel &&
        matchFlavours(activePreNodeModel, ['affine:group'])
      ) {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLInputElement
        ).focus();
      } else if (
        activePreNodeModel &&
        NON_TEXT_ARR.includes(activePreNodeModel.type)
      ) {
        const pageBlock = getDefaultPageBlock(model);
        pageBlock.selection.state.type = 'block';
        const dividerBlockElement = getBlockElementByModel(
          activePreNodeModel
        ) as HTMLElement;
        const selectionRect = dividerBlockElement.getBoundingClientRect();
        signals.updateSelectedRects.emit([selectionRect]);
        pageBlock.selection.state.selectedBlocks.push(dividerBlockElement);
        resetNativeSelection(null);
      } else {
        focusNextBlock(model, new Point(left, bottom));
      }
    }
  } else {
    signals.updateSelectedRects.emit([]);
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const container = getContainerByModel(selectedModel);
    const preNodeModel = getPreviousBlock(container, selectedModel.id);
    assertExists(preNodeModel);
    if (
      matchFlavours(preNodeModel, ['affine:list']) ||
      matchFlavours(preNodeModel, ['affine:paragraph'])
    ) {
      focusNextBlock(selectedModel, 'end');
      state.clear();
      return;
    } else if (NON_TEXT_ARR.includes(selectedModel.type)) {
      const preNodeElement = getBlockElementByModel(preNodeModel);
      assertExists(preNodeElement);
      state.selectedBlocks.push(preNodeElement);
      signals.updateSelectedRects.emit([
        preNodeElement.getBoundingClientRect(),
      ]);
    }
  }

  // const { state } = selection;
  // if (state.selectedBlocks.length === 1) {
  //   const selectedModel = getModelByElement(state.selectedBlocks[0]);
  //   if (!matchFlavours(selectedModel, ['affine:divider'])) {
  //     return;
  //   }
  //   const nextBlock = getNextBlock(selectedModel.id);
  //   if (!nextBlock) {
  //     return;
  //   } else if (
  //     matchFlavours(nextBlock, ['affine:list']) ||
  //     matchFlavours(nextBlock, ['affine:paragraph'])
  //   ) {
  //     focusNextBlock(selectedModel, 'end');
  //     state.clear();
  //     return;
  //   } else if (matchFlavours(nextBlock, ['affine:divider'])) {
  //     const selectionManager = getDefaultPageBlock(selectedModel).selection;
  //     const dividerBlockElement = getBlockElementByModel(
  //       nextBlock
  //     ) as HTMLElement;
  //     // const selectionRect = dividerBlockElement.getBoundingClientRect();
  //     // selectionManager.selectBlockByRect(selectionRect, nextBlock);
  //     // state.type = 'divider';
  //     return;
  //   }
  // }
}
@customElement('default-page-block')
export class DefaultPageBlockComponent extends LitElement implements BlockHost {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  page!: Page;

  flavour = 'affine:page' as const;

  selection!: DefaultSelectionManager;

  lastSelectionPosition: SelectionPosition = 'start';

  @property()
  mouseRoot!: HTMLElement;

  @state()
  frameSelectionRect: DOMRect | null = null;

  @state()
  selectedRects: DOMRect[] = [];

  @state()
  selectEmbedRects: {
    left: number;
    top: number;
    width: number;
    height: number;
  }[] = [];

  @state()
  embedOption!: EmbedOption | null;

  signals: DefaultPageSignals = {
    updateFrameSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
    updateEmbedRects: new Signal<
      { left: number; top: number; width: number; height: number }[]
    >(),
    updateEmbedOption: new Signal<EmbedOption | null>(),
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
    const { page } = this;
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
      UP,
      DOWN,
      LEFT,
      RIGHT,
    } = HOTKEYS;

    bindCommonHotkey(page);
    const { state } = this.selection;
    hotkey.addListener(BACKSPACE, e => {
      const { state } = this.selection;

      if (state.type === 'native') {
        handleBackspace(page, e);
        return;
      } else if (state.type === 'block') {
        const { selectedBlocks } = state;
        handleBlockSelectionBatchDelete(
          page,
          selectedBlocks.map(block => getModelByElement(block))
        );

        state.clear();
        this.signals.updateSelectedRects.emit([]);
        this.signals.updateEmbedRects.emit([]);
        this.signals.updateEmbedOption.emit(null);
        return;
      }
      if (isPageTitle(e)) {
        const target = e.target as HTMLInputElement;
        // range delete
        if (target.selectionStart !== target.selectionEnd) {
          e.preventDefault();
          const title = getSplicedTitle(target);
          page.updateBlock(this.model, { title });
        }
        // collapsed delete
        else {
          noop();
        }
        return;
      }
    });

    hotkey.addListener(SELECT_ALL, e => {
      e.preventDefault();
      handleSelectAll();
      this.selection.state.type = 'native';
    });

    hotkey.addListener(UP, e => {
      handleUp(this.selection, this.signals);
    });
    hotkey.addListener(DOWN, e => {
      handleDown(this.selection, this.signals);
    });
    hotkey.addListener(LEFT, e => {
      // const selection = window.getSelection();
      console.log('test');
      // console.log('selection: ', this.selection.state.selectedBlocks);
      let model: BaseBlockModel | null = null;
      if (this.selection.state.selectedBlocks.length) {
        model = getModelByElement(this.selection.state.selectedBlocks[0]);
        this.signals.updateSelectedRects.emit([]);
        this.selection.state.clear();
      } else {
        const range = window.getSelection()?.getRangeAt(0);
        if (range && range.collapsed && range.startOffset === 0) {
          // handleUp(this.selection, this.signals);
          model = getStartModelBySelection();
        }
      }
      assertExists(model);
      // const preBlock = getPreviousSiblingById(model.id);
      // console.log('preBlock: ', preBlock);
      // assertExists(preBlock)
      // const html1 = getBlockElementByModel(preBlock)?.querySelector('.rich-text')
      // preBlock?.TEXT_NODE
      model && focusPreviousBlock(model, 'end');
    });
    hotkey.addListener(RIGHT, e => {
      switch (state.type) {
        case 'none':
          break;
        case 'block':
          // state.type = 'divider';
          break;
        case 'divider':
          this.signals.updateSelectedRects.emit([]);
          // handleDown(this.selection);
          break;
        default:
          break;
      }
    });

    hotkey.addListener(H1, () =>
      this._updateType('affine:paragraph', 'h1', page)
    );
    hotkey.addListener(H2, () =>
      this._updateType('affine:paragraph', 'h2', page)
    );
    hotkey.addListener(H3, () =>
      this._updateType('affine:paragraph', 'h3', page)
    );
    hotkey.addListener(H4, () =>
      this._updateType('affine:paragraph', 'h4', page)
    );
    hotkey.addListener(H5, () =>
      this._updateType('affine:paragraph', 'h5', page)
    );
    hotkey.addListener(H6, () =>
      this._updateType('affine:paragraph', 'h6', page)
    );
    hotkey.addListener(NUMBERED_LIST, () =>
      this._updateType('affine:list', 'numbered', page)
    );
    hotkey.addListener(BULLETED, () =>
      this._updateType('affine:list', 'bulleted', page)
    );
    hotkey.addListener(TEXT, () =>
      this._updateType('affine:paragraph', 'text', page)
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
      HOTKEYS.UP,
      HOTKEYS.DOWN,
      HOTKEYS.LEFT,
      HOTKEYS.RIGHT,
    ]);
  }

  private _onTitleKeyDown(e: KeyboardEvent) {
    const hasContent = !this.page.isEmpty;

    if (e.key === 'Enter' && hasContent) {
      assertExists(this._title.selectionStart);
      const titleCursorIndex = this._title.selectionStart;
      const contentLeft = this._title.value.slice(0, titleCursorIndex);
      const contentRight = this._title.value.slice(titleCursorIndex);

      const defaultGroup = this.model.children[0];
      const props = {
        flavour: 'affine:paragraph',
        text: new Text(this.page, contentRight),
      };
      const newFirstParagraphId = this.page.addBlock(props, defaultGroup, 0);
      this.page.updateBlock(this.model, { title: contentLeft });
      asyncFocusRichText(this.page, newFirstParagraphId);
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      asyncFocusRichText(this.page, this.model.children[0].children[0].id);
    }
  }

  private _onTitleInput(e: InputEvent) {
    const { page: space } = this;

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

  private _updateType(flavour: string, type: string, space: Page) {
    const { state } = this.selection;
    if (state.selectedBlocks.length > 0) {
      batchUpdateTextType(
        flavour,
        space,
        state.selectedBlocks.map(block => getModelByElement(block)),
        type
      );
    } else {
      updateTextType(flavour, type, space);
    }
  }

  private _clearSelection() {
    this.selection.state.clear();
    this.signals.updateSelectedRects.emit([]);
    this.signals.updateEmbedRects.emit([]);
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('page')) {
      this.selection = new DefaultSelectionManager(
        this.page,
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
    this.signals.updateEmbedRects.on(rects => {
      this.selectEmbedRects = rects;
      this.requestUpdate();
    });
    this.signals.updateEmbedOption.on(embedOption => {
      this.embedOption = embedOption;
      this.requestUpdate();
    });
    tryUpdateGroupSize(this.page, 1);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateGroupSize(this.page, 1);
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
    const selectedEmbedContainer = EmbedSelectedRectsContainer(
      this.selectEmbedRects
    );
    const embedOptionContainer = EmbedOptionContainer(
      this.embedOption,
      this.signals
    );
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
        ${selectedRectsContainer} ${selectionRect}
        ${selectedEmbedContainer}${embedOptionContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-page-block': DefaultPageBlockComponent;
  }
}
