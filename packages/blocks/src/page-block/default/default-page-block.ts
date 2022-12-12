/// <reference types="vite/client" />
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  BaseBlockModel,
  Disposable,
  Page,
  Signal,
  Text,
} from '@blocksuite/store';
import type { PageBlockModel } from '..';
import {
  assertExists,
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  type BlockHost,
  focusNextBlock,
  focusPreviousBlock,
  getBlockElementByModel,
  getContainerByModel,
  getCurrentRange,
  getDefaultPageBlock,
  getModelByElement,
  getModelsByRange,
  getNextBlock,
  getPreviousBlock,
  getSplicedTitle,
  getStartModelBySelection,
  hotkey,
  HOTKEYS,
  isMultiBlockRange,
  isPageTitle,
  matchFlavours,
  noop,
  SelectionPosition,
} from '../../__internal__';
import { DefaultSelectionManager } from './selection-manager';
import {
  batchUpdateTextType,
  bindCommonHotkey,
  deleteModels,
  handleBackspace,
  handleBlockSelectionBatchDelete,
  handleSelectAll,
  removeCommonHotKey,
  tryUpdateGroupSize,
  updateTextType,
} from '../utils';
import style from './style.css';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from '../../image-block/icons';
import { LineWrapIcon, SwitchLangIcon } from '../../code-block/icons';
import {
  copyCode,
  copyImgToClip,
  deleteCodeBlock,
  downloadImage,
  focusCaption,
  toggleWrap,
} from './utils';

export interface EmbedOption {
  position: { x: number; y: number };
  model: BaseBlockModel;
}

export type CodeBlockOption = EmbedOption;

export interface DefaultPageSignals {
  updateFrameSelectionRect: Signal<DOMRect | null>;
  updateSelectedRects: Signal<DOMRect[]>;
  updateEmbedRects: Signal<
    { left: number; top: number; width: number; height: number }[]
  >;
  updateEmbedOption: Signal<EmbedOption | null>;
  updateCodeBlockOption: Signal<CodeBlockOption | null>;
  nativeSelection: Signal<boolean>;
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
        return html` <div class="resizes" style=${styleMap(style)}>
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
        return html` <div style=${styleMap(style)}></div>`;
      })}
    </div>
  `;
}

function CodeBlockOptionContainer(codeBlockOption: CodeBlockOption | null) {
  if (codeBlockOption) {
    const style = {
      left: codeBlockOption.position.x + 'px',
      top: codeBlockOption.position.y + 'px',
    };
    return html`
      <style>
        .affine-codeblock-option-container > ul {
          position: fixed;
          z-index: 1;
        }
      </style>

      <div class="affine-codeblock-option-container">
        <ul style=${styleMap(style)} class="code-block-option">
          <li
            @click=${() => {
              console.log('a');
            }}
          >
            ${SwitchLangIcon}
          </li>
          <li @click=${() => copyCode(codeBlockOption)}>${CopyIcon}</li>
          <li @click=${() => toggleWrap(codeBlockOption)}>${LineWrapIcon}</li>
          <li @click=${() => deleteCodeBlock(codeBlockOption)}>
            ${DeleteIcon}
          </li>
        </ul>
      </div>
    `;
  } else {
    return html``;
  }
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

function handleUp(selection: DefaultSelectionManager) {
  const { state } = selection;
  if (state.selectedBlocks.length === 1) {
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    if (!matchFlavours(selectedModel, ['affine:divider'])) {
      return;
    }
    const container = getContainerByModel(selectedModel);
    const preNodeModel = getPreviousBlock(container, selectedModel.id);
    if (!preNodeModel || preNodeModel.id == '1') {
      return;
    } else if (
      matchFlavours(preNodeModel, ['affine:list']) ||
      matchFlavours(preNodeModel, ['affine:paragraph'])
    ) {
      focusPreviousBlock(selectedModel, 'end');
      state.clear();
      return;
    } else if (matchFlavours(preNodeModel, ['affine:divider'])) {
      const selectionManager = getDefaultPageBlock(selectedModel).selection;
      const dividerBlockElement = getBlockElementByModel(
        preNodeModel
      ) as HTMLElement;
      const selectionRect = dividerBlockElement.getBoundingClientRect();
      selectionManager.selectBlockByRect(selectionRect, preNodeModel);
      state.type = 'divider';
      return;
    }
  }
}

function handleDown(selection: DefaultSelectionManager) {
  const { state } = selection;
  if (state.selectedBlocks.length === 1) {
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    if (!matchFlavours(selectedModel, ['affine:divider'])) {
      return;
    }
    const nextBlock = getNextBlock(selectedModel.id);
    if (!nextBlock) {
      return;
    } else if (
      matchFlavours(nextBlock, ['affine:list']) ||
      matchFlavours(nextBlock, ['affine:paragraph'])
    ) {
      focusNextBlock(selectedModel, 'start');
      state.clear();
      return;
    } else if (matchFlavours(nextBlock, ['affine:divider'])) {
      const selectionManager = getDefaultPageBlock(selectedModel).selection;
      const dividerBlockElement = getBlockElementByModel(
        nextBlock
      ) as HTMLElement;
      const selectionRect = dividerBlockElement.getBoundingClientRect();
      selectionManager.selectBlockByRect(selectionRect, nextBlock);
      state.type = 'divider';
      return;
    }
  }
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

  @state()
  codeBlockOption!: CodeBlockOption | null;

  signals: DefaultPageSignals = {
    updateFrameSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
    updateEmbedRects: new Signal<
      { left: number; top: number; width: number; height: number }[]
    >(),
    updateEmbedOption: new Signal<EmbedOption | null>(),
    updateCodeBlockOption: new Signal<CodeBlockOption | null>(),
    nativeSelection: new Signal<boolean>(),
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
      CODE_BLOCK,
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
      } else if (['block', 'divider', 'focus'].includes(state.type)) {
        const { selectedBlocks } = state;
        if (state.type === 'focus') {
          state.type = 'block';
          return;
        }
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
          page.workspace.setPageMeta(page.id, { title });
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
      switch (state.type) {
        case 'none':
          break;
        case 'block':
          state.type = 'divider';
          break;
        case 'divider':
          this.signals.updateSelectedRects.emit([]);
          handleUp(this.selection);

          break;
        default:
          break;
      }
    });
    hotkey.addListener(DOWN, e => {
      switch (state.type) {
        case 'none':
          break;
        case 'block':
          state.type = 'divider';
          break;
        case 'divider':
          this.signals.updateSelectedRects.emit([]);
          handleDown(this.selection);
          break;
        default:
          break;
      }
    });
    hotkey.addListener(LEFT, e => {
      switch (state.type) {
        case 'none':
          break;
        case 'block':
          state.type = 'divider';
          break;
        case 'divider':
          this.signals.updateSelectedRects.emit([]);
          handleUp(this.selection);
          break;
        default:
          break;
      }
    });
    hotkey.addListener(RIGHT, e => {
      switch (state.type) {
        case 'none':
          break;
        case 'block':
          state.type = 'divider';
          break;
        case 'divider':
          this.signals.updateSelectedRects.emit([]);
          handleDown(this.selection);
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
    hotkey.addListener(CODE_BLOCK, e => {
      const startModel = getStartModelBySelection();
      const parent = page.getParent(startModel);
      const index = parent?.children.indexOf(startModel);
      assertExists(parent);
      const blockProps = {
        flavour: 'affine:code-block',
        text: startModel.text?.clone(),
      };
      page.deleteBlock(startModel);
      page.addBlock(blockProps, parent, index);
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
    const { page, model, _title } = this;

    if (e.key === 'Enter' && hasContent) {
      assertExists(_title.selectionStart);
      const titleCursorIndex = _title.selectionStart;
      const contentLeft = _title.value.slice(0, titleCursorIndex);
      const contentRight = _title.value.slice(titleCursorIndex);

      const defaultGroup = model.children[0];
      const props = {
        flavour: 'affine:paragraph',
        text: new Text(page, contentRight),
      };
      const newFirstParagraphId = page.addBlock(props, defaultGroup, 0);
      page.updateBlock(model, { title: contentLeft });
      page.workspace.setPageMeta(page.id, { title: contentLeft });
      asyncFocusRichText(this.page, newFirstParagraphId);
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      asyncFocusRichText(page, model.children[0].children[0].id);
    }
  }

  private _onTitleInput(e: InputEvent) {
    const { page } = this;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      const pageId = page.addBlock({ flavour: 'affine:page', title });
      const groupId = page.addBlock({ flavour: 'affine:group' }, pageId);
      page.addBlock({ flavour: 'affine:paragraph' }, groupId);
      return;
    }

    const title = (e.target as HTMLInputElement).value;
    page.updateBlock(this.model, { title });
    page.workspace.setPageMeta(page.id, { title });
  }

  private _updateType(flavour: string, type: string, page: Page) {
    const { state } = this.selection;
    if (state.selectedBlocks.length > 0) {
      batchUpdateTextType(
        flavour,
        page,
        state.selectedBlocks.map(block => getModelByElement(block)),
        type
      );
    } else {
      updateTextType(flavour, type, page);
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

  // Fixes: https://github.com/toeverything/blocksuite/issues/200
  // We shouldn't prevent user input, because there could have CN/JP/KR... input,
  //  that have pop-up for selecting local characters.
  // So we could just hook on the keydown event and detect whether user input a new character.
  private _handleNativeKeydown = (e: KeyboardEvent) => {
    // Only the length of character buttons is 1
    if (
      (e.key.length === 1 || e.key === 'Enter') &&
      window.getSelection()?.type === 'Range'
    ) {
      const range = getCurrentRange();
      if (isMultiBlockRange(range)) {
        const intersectedModels = getModelsByRange(range);
        deleteModels(this.page, intersectedModels);
      }
      window.removeEventListener('keydown', this._handleNativeKeydown);
    } else if (window.getSelection()?.type !== 'Range') {
      // remove, user don't have native selection
      window.removeEventListener('keydown', this._handleNativeKeydown);
    }
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
    this.signals.updateCodeBlockOption.on(codeBlockOption => {
      this.codeBlockOption = codeBlockOption;
      this.requestUpdate();
    });

    this.signals.nativeSelection.on(bind => {
      if (bind) {
        window.addEventListener('keydown', this._handleNativeKeydown);
      } else {
        window.removeEventListener('keydown', this._handleNativeKeydown);
      }
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
    const codeBlockOptionContainer = CodeBlockOptionContainer(
      this.codeBlockOption
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
        ${codeBlockOptionContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-page-block': DefaultPageBlockComponent;
  }
}
