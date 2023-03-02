/// <reference types="vite/client" />
import { BLOCK_ID_ATTR, SCROLL_THRESHOLD } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { Utils } from '@blocksuite/store';
import {
  BaseBlockModel,
  DisposableGroup,
  Page,
  Signal,
} from '@blocksuite/store';
import { VEditor, ZERO_WIDTH_SPACE } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  asyncFocusRichText,
  BlockChildrenContainer,
  type BlockHost,
  getCurrentNativeRange,
  getRichTextByModel,
  hasNativeSelection,
  hotkey,
  isMultiBlockRange,
  SelectionPosition,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service.js';
import { NonShadowLitElement } from '../../__internal__/utils/lit.js';
import type { DragHandle } from '../../components/index.js';
import type { PageBlockModel } from '../index.js';
import { bindHotkeys, removeHotkeys } from '../utils/bind-hotkey.js';
import { deleteModelsByRange, tryUpdateFrameSize } from '../utils/index.js';
import {
  CodeBlockOptionContainer,
  EmbedEditingContainer,
  EmbedSelectedRectsContainer,
  FrameSelectionRect,
  SelectedRectsContainer,
} from './components.js';
import { DefaultSelectionManager } from './selection-manager.js';
import {
  createDragHandle,
  getAllowSelectedBlocks,
  isControlledKeyboardEvent,
} from './utils.js';

export interface EmbedEditingState {
  position: { x: number; y: number };
  model: BaseBlockModel;
}

export interface ViewportState {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
  // scrollWidth: number,
}

export type CodeBlockOption = EmbedEditingState;

export interface DefaultPageSignals {
  updateFrameSelectionRect: Signal<DOMRect | null>;
  updateSelectedRects: Signal<DOMRect[]>;
  updateEmbedRects: Signal<DOMRect[]>;
  updateEmbedEditingState: Signal<EmbedEditingState | null>;
  updateCodeBlockOption: Signal<CodeBlockOption | null>;
  nativeSelection: Signal<boolean>;
}

@customElement('affine-default-page')
export class DefaultPageBlockComponent
  extends NonShadowLitElement
  implements BlockHost
{
  static styles = css`
    .affine-default-viewport {
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
      height: 100%;
    }

    .affine-default-page-block-container {
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-color);
      font-weight: 400;
      width: var(--affine-editor-width);
      margin: 0 auto;
      /* cursor: crosshair; */
      cursor: default;

      min-height: calc(100% - 78px);
      padding-bottom: 150px;
    }

    .affine-default-page-block-title {
      width: 100%;
      font-size: 40px;
      line-height: 50px;
      font-weight: 700;
      outline: none;
      resize: none;
      border: 0;
      font-family: inherit;
      color: inherit;
      cursor: text;
    }

    .affine-default-page-block-title-empty::before {
      content: 'Title';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
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

  selection!: DefaultSelectionManager;
  getService = getService;

  lastSelectionPosition: SelectionPosition = 'start';

  /**
   * shard components
   */
  components: {
    dragHandle: DragHandle | null;
    resizeObserver: ResizeObserver | null;
  } = {
    dragHandle: null,
    resizeObserver: null,
  };

  @property()
  mouseRoot!: HTMLElement;

  @state()
  private _frameSelectionRect: DOMRect | null = null;

  @property()
  viewportState: ViewportState = {
    left: 0,
    top: 0,
    scrollLeft: 0,
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    clientWidth: 0,
  };

  @state()
  private _selectedRects: DOMRect[] = [];

  @state()
  private _selectedEmbedRects: DOMRect[] = [];

  @state()
  private _embedEditingState!: EmbedEditingState | null;

  @property()
  codeBlockOption!: CodeBlockOption | null;

  @query('.affine-default-viewport')
  defaultViewportElement!: HTMLDivElement;

  signals: DefaultPageSignals = {
    updateFrameSelectionRect: new Signal<DOMRect | null>(),
    updateSelectedRects: new Signal<DOMRect[]>(),
    updateEmbedRects: new Signal<DOMRect[]>(),
    updateEmbedEditingState: new Signal<EmbedEditingState | null>(),
    updateCodeBlockOption: new Signal<CodeBlockOption | null>(),
    nativeSelection: new Signal<boolean>(),
  };

  public isCompositionStart = false;

  @property({ hasChanged: () => true })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  private _titleContainer!: HTMLElement;
  private _titleVEditor: VEditor | null = null;

  get titleVEditor() {
    assertExists(this._titleVEditor);
    return this._titleVEditor;
  }

  private initTitleVEditor() {
    const { model } = this;
    const title = model.title;

    this._titleVEditor = new VEditor(title.yText);
    this._titleVEditor.bindKeyDownHandler(this._onTitleKeyDown);
    this._titleVEditor.mount(this._titleContainer);
    this.model.title.yText.observe(() => {
      this.page.workspace.setPageMeta(this.page.id, {
        title: this.model.title.toString(),
      });
      this.requestUpdate();
    });
    this._titleVEditor.focusEnd();
  }

  private _onTitleKeyDown = (e: KeyboardEvent) => {
    const hasContent = !this.page.isEmpty;
    const { page, model } = this;
    const defaultFrame = model.children[0];

    if (e.key === 'Enter' && hasContent) {
      e.preventDefault();
      e.stopPropagation();
      assertExists(this._titleVEditor);
      const vRange = this._titleVEditor.getVRange();
      assertExists(vRange);
      const right = model.title.split(vRange.index);

      const block = defaultFrame.children.find(block =>
        getRichTextByModel(block)
      );
      if (block) {
        asyncFocusRichText(page, block.id);
      }
      const newFirstParagraphId = page.addBlockByFlavour(
        'affine:paragraph',
        { text: right },
        defaultFrame,
        0
      );
      asyncFocusRichText(page, newFirstParagraphId);
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      const firstParagraph = model.children[0].children[0];
      if (firstParagraph) {
        asyncFocusRichText(page, firstParagraph.id);
      } else {
        const newFirstParagraphId = page.addBlockByFlavour(
          'affine:paragraph',
          {},
          defaultFrame,
          0
        );
        asyncFocusRichText(page, newFirstParagraphId);
      }
    }
  };

  // TODO: disable it on scroll's thresold
  private _onWheel = (e: WheelEvent) => {
    const { selection } = this;
    const { state } = selection;
    const { type } = state;

    if (type === 'native') {
      return;
    }

    if (type === 'block') {
      const { viewportState, defaultViewportElement } = this;
      const { scrollTop, scrollHeight, clientHeight } = viewportState;
      const max = scrollHeight - clientHeight;
      let top = e.deltaY / 2;
      if (top > 0) {
        if (Math.ceil(scrollTop) === max) return;

        top = Math.min(top, max - scrollTop);
      } else if (top < 0) {
        if (scrollTop === 0) return;

        top = Math.max(top, -scrollTop);
      }

      const { startPoint, endPoint } = state;
      if (startPoint && endPoint) {
        e.preventDefault();

        viewportState.scrollTop += top;
        // FIXME: need smooth
        defaultViewportElement.scrollTop += top;

        endPoint.y += top;
        selection.updateSelectionRect(startPoint, endPoint);
      }
    }

    // trigger native scroll
  };

  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event
  // May need optimization
  // private _onResize = (_: Event) => {
  // };

  private _onScroll = (e: Event) => {
    const { selection, viewportState } = this;
    const { type } = selection.state;
    const { scrollLeft, scrollTop } = e.target as Element;
    viewportState.scrollLeft = scrollLeft;
    viewportState.scrollTop = scrollTop;

    if (type === 'block') {
      selection.refreshSelectionRectAndSelecting(viewportState);
    } else if (type === 'embed') {
      selection.refreshEmbedRects(this._embedEditingState);
    } else if (type === 'native') {
      const { startRange, rangePoint } = selection.state;
      if (startRange && rangePoint) {
        // Create a synthetic `mousemove` MouseEvent
        const evt = new MouseEvent('mousemove', {
          clientX: rangePoint.x,
          clientY: rangePoint.y,
        });
        this.mouseRoot.dispatchEvent(evt);
      }
    }
  };

  updated(changedProperties: Map<string, unknown>) {
    if (this._titleVEditor && changedProperties.has('readonly')) {
      this._titleVEditor.setReadOnly(this.readonly);
    }

    if (changedProperties.has('model')) {
      if (this.model && !this._titleVEditor) {
        this.initTitleVEditor();
      }
    }
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('page')) {
      this.selection = new DefaultSelectionManager({
        page: this.page,
        mouseRoot: this.mouseRoot,
        signals: this.signals,
        container: this,
        threshold: SCROLL_THRESHOLD / 2, // 50
      });
    }

    super.update(changedProperties);
  }

  private _handleCompositionStart = () => {
    this.isCompositionStart = true;
  };

  private _handleCompositionEnd = () => {
    this.isCompositionStart = false;
  };

  // TODO migrate to bind-hotkey
  // Fixes: https://github.com/toeverything/blocksuite/issues/200
  // We shouldn't prevent user input, because there could have CN/JP/KR... input,
  //  that have pop-up for selecting local characters.
  // So we could just hook on the keydown event and detect whether user input a new character.
  private _handleNativeKeydown = (e: KeyboardEvent) => {
    if (isControlledKeyboardEvent(e)) {
      return;
    }
    // Only the length of character buttons is 1
    if (e.key.length === 1 && hasNativeSelection()) {
      const range = getCurrentNativeRange();
      if (isMultiBlockRange(range)) {
        deleteModelsByRange(this.page);
      }
      window.removeEventListener('keydown', this._handleNativeKeydown);
    } else if (window.getSelection()?.type !== 'Range') {
      // remove, user don't have native selection
      window.removeEventListener('keydown', this._handleNativeKeydown);
    }
  };

  private _initDragHandle = () => {
    const createHandle = () => {
      this.components.dragHandle = createDragHandle(this);
      this.components.dragHandle.getDropAllowedBlocks = draggingBlockIds => {
        if (
          draggingBlockIds &&
          draggingBlockIds.length === 1 &&
          Utils.doesInsideBlockByFlavour(
            this.page,
            draggingBlockIds[0],
            'affine:database'
          )
        ) {
          return getAllowSelectedBlocks(
            this.page.getParent(draggingBlockIds[0]) as BaseBlockModel
          );
        }

        if (!draggingBlockIds || draggingBlockIds.length === 1) {
          return getAllowSelectedBlocks(this.model);
        } else {
          return getAllowSelectedBlocks(this.model).filter(block => {
            return !draggingBlockIds?.includes(block.id);
          });
        }
      };
    };
    if (
      this.page.awarenessStore.getFlag('enable_drag_handle') &&
      !this.components.dragHandle
    ) {
      createHandle();
    }
    this._disposables.add(
      this.page.awarenessStore.signals.update.subscribe(
        msg => msg.state?.flags.enable_drag_handle,
        enable => {
          if (enable) {
            if (!this.components.dragHandle) {
              createHandle();
            }
          } else {
            this.components.dragHandle?.remove();
            this.components.dragHandle = null;
          }
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );
  };

  updateViewportState() {
    const viewport = this.defaultViewportElement;
    const { scrollLeft, scrollTop, scrollHeight, clientHeight, clientWidth } =
      viewport;
    const { top, left } = viewport.getBoundingClientRect();
    this.viewportState = {
      top,
      left,
      scrollTop,
      scrollLeft,
      scrollHeight,
      clientHeight,
      clientWidth,
    };
  }

  firstUpdated() {
    bindHotkeys(this.page, this.selection, this.signals);

    hotkey.enableHotkey();

    this.signals.updateFrameSelectionRect.on(rect => {
      this._frameSelectionRect = rect;
      this.requestUpdate();
    });
    this.signals.updateSelectedRects.on(rects => {
      this._selectedRects = rects;
      this.requestUpdate();
    });
    this.signals.updateEmbedRects.on(rects => {
      this._selectedEmbedRects = rects;
      if (rects.length === 0) {
        this._embedEditingState = null;
      }
      this.requestUpdate();
    });
    this.signals.updateEmbedEditingState.on(embedEditingState => {
      this._embedEditingState = embedEditingState;
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

    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        for (const { target } of entries) {
          if (target === this.defaultViewportElement) {
            this.updateViewportState();
            this.selection.refresh();
            break;
          }
        }
      }
    );
    resizeObserver.observe(this.defaultViewportElement);
    this.components.resizeObserver = resizeObserver;

    this.defaultViewportElement.addEventListener('wheel', this._onWheel);
    this.defaultViewportElement.addEventListener('scroll', this._onScroll);
    // window.addEventListener('resize', this._onResize);
    window.addEventListener('compositionstart', this._handleCompositionStart);
    window.addEventListener('compositionend', this._handleCompositionEnd);

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
  }

  private _disposables = new DisposableGroup();

  override connectedCallback() {
    super.connectedCallback();
    this._initDragHandle();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
    this.components.dragHandle?.remove();

    removeHotkeys();
    this.selection.clear();
    this.selection.dispose();
    if (this.components.resizeObserver) {
      this.components.resizeObserver.disconnect();
      this.components.resizeObserver = null;
    }
    this.defaultViewportElement.removeEventListener('wheel', this._onWheel);
    this.defaultViewportElement.removeEventListener('scroll', this._onScroll);
    // window.removeEventListener('resize', this._onResize);
    window.removeEventListener(
      'compositionstart',
      this._handleCompositionStart
    );
    window.removeEventListener('compositionend', this._handleCompositionEnd);
  }

  render() {
    const { readonly } = this;

    const childrenContainer = BlockChildrenContainer(this.model, this, () =>
      this.requestUpdate()
    );
    const selectionRect = FrameSelectionRect(this._frameSelectionRect);
    const selectedRectsContainer = SelectedRectsContainer(
      this._selectedRects,
      this.viewportState
    );
    const selectedEmbedContainer = EmbedSelectedRectsContainer(
      this._selectedEmbedRects,
      this.viewportState
    );
    const embedEditingContainer = EmbedEditingContainer(
      readonly ? null : this._embedEditingState,
      this.signals,
      this.viewportState
    );
    const codeBlockOptionContainer = CodeBlockOptionContainer(
      readonly ? null : this.codeBlockOption
    );

    return html`
      <div class="affine-default-viewport">
        <div class="affine-default-page-block-container">
          <div class="affine-default-page-block-title-container">
            <div
              data-block-is-title="true"
              class="affine-default-page-block-title ${!this._titleContainer ||
              this._titleContainer.innerText === ZERO_WIDTH_SPACE
                ? 'affine-default-page-block-title-empty'
                : ''}"
            ></div>
          </div>
          ${childrenContainer}
        </div>
        ${selectedRectsContainer} ${selectionRect} ${selectedEmbedContainer}
        ${embedEditingContainer} ${codeBlockOptionContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-default-page': DefaultPageBlockComponent;
  }
}
