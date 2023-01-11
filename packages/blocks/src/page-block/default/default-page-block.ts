/// <reference types="vite/client" />
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { BaseBlockModel, Page, Signal, Text } from '@blocksuite/store';
import type { PageBlockModel } from '../index.js';
import {
  assertExists,
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  type BlockHost,
  createFlagsContext,
  getCurrentRange,
  hotkey,
  isMultiBlockRange,
  SelectionPosition,
} from '../../__internal__/index.js';
import { DefaultSelectionManager } from './selection-manager.js';
import { deleteModelsByRange, tryUpdateFrameSize } from '../utils/index.js';
import {
  CodeBlockOptionContainer,
  EmbedEditingContainer,
  EmbedSelectedRectsContainer,
  FrameSelectionRect,
  SelectedRectsContainer,
} from './components.js';
import {
  bindHotkeys,
  isControlledKeyboardEvent,
  removeHotkeys,
} from './utils.js';
import { NonShadowLitElement } from '../../__internal__/utils/lit.js';
import { getService } from '../../__internal__/service.js';
import autosize from 'autosize';

export interface EmbedEditingState {
  position: { x: number; y: number };
  model: BaseBlockModel;
}

export type CodeBlockOption = EmbedEditingState;

export interface DefaultPageSignals {
  updateFrameSelectionRect: Signal<DOMRect | null>;
  updateSelectedRects: Signal<DOMRect[]>;
  updateEmbedRects: Signal<
    { left: number; top: number; width: number; height: number }[]
  >;
  updateEmbedEditingState: Signal<EmbedEditingState | null>;
  updateCodeBlockOption: Signal<CodeBlockOption | null>;
  nativeSelection: Signal<boolean>;
}

// https://stackoverflow.com/a/2345915
function focusTextEnd(input: HTMLTextAreaElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}

@customElement('affine-default-page')
export class DefaultPageBlockComponent
  extends NonShadowLitElement
  implements BlockHost
{
  static styles = css`
    .affine-default-viewport {
      overflow-x: hidden;
      overflow-y: auto;
      height: 100%;
    }
    .affine-default-page-block-container {
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height-base);
      color: var(--affine-text-color);
      font-weight: 400;
      width: 720px;
      margin: 0 auto;
      /* cursor: crosshair; */
      cursor: default;

      min-height: calc(100% - 78px);
      height: auto;
      overflow: hidden;
      padding-bottom: 150px;
    }

    .affine-default-page-block-container > .affine-block-children-container {
      padding-left: 0;
    }

    .affine-default-page-block-title {
      /* autosize will calculate height automatically */
      height: 0;
      width: 100%;
      font-size: 40px;
      line-height: 50px;
      font-weight: 700;
      outline: none;
      resize: none;
      border: 0;
      font-family: inherit;
      color: inherit;
    }

    .affine-default-page-block-title::placeholder {
      color: var(--affine-placeholder-color);
    }
    .affine-default-page-block-title:disabled {
      background-color: transparent;
    }
    .affine-default-page-block-title-container {
      margin-top: 78px;
    }
  `;

  @property()
  page!: Page;

  @property()
  readonly = false;

  flavour = 'affine:page' as const;

  flagsContext = createFlagsContext();

  selection!: DefaultSelectionManager;
  getService = getService;

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
  embedEditingState!: EmbedEditingState | null;

  @state()
  codeBlockOption!: CodeBlockOption | null;

  signals: DefaultPageSignals = {
    updateFrameSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
    updateEmbedRects: new Signal<
      { left: number; top: number; width: number; height: number }[]
    >(),
    updateEmbedEditingState: new Signal<EmbedEditingState | null>(),
    updateCodeBlockOption: new Signal<CodeBlockOption | null>(),
    nativeSelection: new Signal<boolean>(),
  };

  public isCompositionStart = false;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  private _title!: HTMLTextAreaElement;

  private _onTitleKeyDown(e: KeyboardEvent) {
    const hasContent = !this.page.isEmpty;
    const { page, model, _title } = this;

    if (e.key === 'Enter' && hasContent) {
      assertExists(_title.selectionStart);
      const titleCursorIndex = _title.selectionStart;
      const contentLeft = _title.value.slice(0, titleCursorIndex);
      const contentRight = _title.value.slice(titleCursorIndex);

      const defaultFrame = model.children[0];
      const props = {
        flavour: 'affine:paragraph',
        text: new Text(page, contentRight),
      };
      const newFirstParagraphId = page.addBlock(props, defaultFrame, 0);
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
      const title = (e.target as HTMLTextAreaElement).value;
      const pageId = page.addBlock({ flavour: 'affine:page', title });
      const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);
      page.addBlock({ flavour: 'affine:paragraph' }, frameId);
      return;
    }

    let title = (e.target as HTMLTextAreaElement).value;
    if (title.endsWith('\n')) {
      title = title.slice(0, -1);
    }
    page.updateBlock(this.model, { title });
    page.workspace.setPageMeta(page.id, { title });
  }

  private _clearSelection = () => {
    this.selection.state.clear();
    this.signals.updateSelectedRects.emit([]);
    this.signals.updateEmbedRects.emit([]);
    this.signals.updateEmbedEditingState.emit(null);
  };

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('page')) {
      this.selection = new DefaultSelectionManager({
        page: this.page,
        mouseRoot: this.mouseRoot,
        signals: this.signals,
        container: this,
      });
    }

    this._tryUpdateMetaTitle();
    super.update(changedProperties);
  }

  // happens on undo/redo (model update)
  private _tryUpdateMetaTitle() {
    const { _title } = this;
    if (!_title || _title.value === undefined) {
      return;
    }

    const { page } = this;
    if (_title.value !== page.meta.title) {
      page.workspace.setPageMeta(page.id, { title: this._title.value });
    }
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
    if (isControlledKeyboardEvent(e)) {
      return;
    }
    // Only the length of character buttons is 1
    if (
      (e.key.length === 1 || e.key === 'Enter') &&
      window.getSelection()?.type === 'Range'
    ) {
      const range = getCurrentRange();
      if (isMultiBlockRange(range)) {
        deleteModelsByRange(this.page);
      }
      window.removeEventListener('keydown', this._handleNativeKeydown);
    } else if (window.getSelection()?.type !== 'Range') {
      // remove, user don't have native selection
      window.removeEventListener('keydown', this._handleNativeKeydown);
    }
  };

  firstUpdated() {
    autosize(this._title);
    bindHotkeys(this.page, this.selection, this.signals, this.model);

    hotkey.enableHotkey();
    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._title.value) {
        this._title.value = this.model.title || '';
        this.requestUpdate();
        autosize.update(this._title);
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
    this.signals.updateEmbedEditingState.on(embedEditingState => {
      this.embedEditingState = embedEditingState;
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

    tryUpdateFrameSize(this.page, 1);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateFrameSize(this.page, 1);
    });

    // TMP: clear selected rects on scroll
    document.addEventListener('wheel', this._clearSelection);
    window.addEventListener('compositionstart', this._handleCompositionStart);
    window.addEventListener('compositionend', this._handleCompositionEnd);

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    focusTextEnd(this._title);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    removeHotkeys();
    this.flagsContext.dispose();
    this.selection.dispose();
    window.removeEventListener(
      'compositionstart',
      this._handleCompositionStart
    );
    window.removeEventListener('compositionend', this._handleCompositionEnd);
    document.removeEventListener('wheel', this._clearSelection);
  }

  render() {
    const childrenContainer = BlockChildrenContainer(this.model, this, () =>
      this.requestUpdate()
    );
    const selectionRect = FrameSelectionRect(this.frameSelectionRect);
    const selectedRectsContainer = SelectedRectsContainer(this.selectedRects);
    const selectedEmbedContainer = EmbedSelectedRectsContainer(
      this.selectEmbedRects
    );
    const embedEditingContainer = EmbedEditingContainer(
      this.embedEditingState,
      this.signals
    );
    const codeBlockOptionContainer = CodeBlockOptionContainer(
      this.codeBlockOption
    );
    return html`
      <div class="affine-default-viewport">
        <div class="affine-default-page-block-container">
          <div class="affine-default-page-block-title-container">
            <textarea
              ?disabled=${this.readonly}
              .value=${this.model.title}
              placeholder="Title"
              class="affine-default-page-block-title"
              @keydown=${this._onTitleKeyDown}
              @input=${this._onTitleInput}
            ></textarea>
          </div>
          ${childrenContainer}
        </div>
        ${selectedRectsContainer} ${selectionRect}
        ${selectedEmbedContainer}${embedEditingContainer}
        ${codeBlockOptionContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-default-page': DefaultPageBlockComponent;
  }
}
