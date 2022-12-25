/// <reference types="vite/client" />
import { LitElement, html, PropertyValueMap } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Signal, Page, Text, BaseBlockModel } from '@blocksuite/store';
import type { PageBlockModel } from '../index.js';
import {
  assertExists,
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  type BlockHost,
  getCurrentRange,
  getModelsByRange,
  hotkey,
  isMultiBlockRange,
  SelectionPosition,
} from '../../__internal__/index.js';
import { DefaultSelectionManager } from './selection-manager.js';
import { deleteModels, tryUpdateGroupSize } from '../utils/index.js';
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
function focusTextEnd(input: HTMLInputElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}

@customElement('affine-default-page')
export class DefaultPageBlockComponent extends LitElement implements BlockHost {
  @property()
  page!: Page;

  @property()
  readonly = false;

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
  private _title!: HTMLInputElement;

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

  private _clearSelection = () => {
    this.selection.state.clear();
    this.signals.updateSelectedRects.emit([]);
    this.signals.updateEmbedRects.emit([]);
    this.signals.updateEmbedEditingState.emit(null);
  };

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('page')) {
      this.selection = new DefaultSelectionManager({
        space: this.page,
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
    bindHotkeys(this.page, this.selection, this.signals, this.model);

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

    tryUpdateGroupSize(this.page, 1);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateGroupSize(this.page, 1);
    });

    // TMP: clear selected rects on scroll
    document.addEventListener('wheel', this._clearSelection);
    window.addEventListener('compositionstart', this._handleCompositionStart);
    window.addEventListener('compositionend', this._handleCompositionEnd);

    focusTextEnd(this._title);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    removeHotkeys();
    this.selection.dispose();
    window.removeEventListener(
      'compositionstart',
      this._handleCompositionStart
    );
    window.removeEventListener('compositionend', this._handleCompositionEnd);
    document.removeEventListener('wheel', this._clearSelection);
  }

  protected updated(changedProperties: PropertyValueMap<this>) {
    const titleInput = this.querySelector('.affine-default-page-block-title');

    if (this.readonly) {
      titleInput?.setAttribute('disabled', 'disabled');
    } else {
      titleInput?.removeAttribute('disabled');
    }
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this);
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
