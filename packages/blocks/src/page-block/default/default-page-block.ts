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
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  asyncFocusRichText,
  BlockChildrenContainer,
  type BlockHost,
  getRichTextByModel,
  hotkey,
  SelectionPosition,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service.js';
import { NonShadowLitElement } from '../../__internal__/utils/lit.js';
import type { DragHandle } from '../../components/index.js';
import type { PageBlockModel } from '../index.js';
import { bindHotkeys, removeHotkeys } from '../utils/bind-hotkey.js';
import { tryUpdateFrameSize } from '../utils/index.js';
import {
  CodeBlockOptionContainer,
  EmbedEditingContainer,
  EmbedSelectedRectsContainer,
  FrameSelectionRect,
  SelectedRectsContainer,
} from './components.js';
import { DefaultSelectionManager } from './selection-manager.js';
import { createDragHandle, getAllowSelectedBlocks } from './utils.js';

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
      height: auto;
      overflow: hidden;
      padding-bottom: 150px;
    }

    .affine-default-page-block-container > .affine-block-children-container {
      padding-left: 0;
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
  frameSelectionRect: DOMRect | null = null;

  @state()
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
  selectedRects: DOMRect[] = [];

  @state()
  selectEmbedRects: DOMRect[] = [];

  @state()
  embedEditingState!: EmbedEditingState | null;

  @state()
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

    this._titleVEditor = new VEditor(title.yText, {
      onKeyDown: this._onTitleKeyDown,
    });
    this._titleVEditor.mount(this._titleContainer);
    this.model.title.yText.observe(() => {
      this.page.workspace.setPageMeta(this.page.id, {
        title: this.model.title.toString(),
      });
    });
    this._titleVEditor.focusEnd();
  }

  private _onTitleKeyDown = (e: KeyboardEvent) => {
    const hasContent = !this.page.isEmpty;
    const { page, model } = this;

    if (e.key === 'Enter' && hasContent) {
      e.preventDefault();
      assertExists(this._titleVEditor);
      const vRange = this._titleVEditor.getVRange();
      assertExists(vRange);
      const right = model.title.split(vRange.index);

      const defaultFrame = model.children[0];
      const props = {
        flavour: 'affine:paragraph',
        text: right,
      };

      const block = defaultFrame.children.find(block =>
        getRichTextByModel(block)
      );
      if (block) {
        asyncFocusRichText(this.page, block.id);
      }
      const newFirstParagraphId = page.addBlock(props, defaultFrame, 0);
      asyncFocusRichText(this.page, newFirstParagraphId);
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      asyncFocusRichText(page, model.children[0].children[0].id);
    }
  };

  // FIXME: keep embed selected rects after scroll
  // TODO: disable it on scroll's thresold
  private _onWheel = (e: WheelEvent) => {
    if (this.selection.state.type !== 'block') {
      this.selection.state.clear();
      // if (this.selection.state.type !== 'embed') {
      this.signals.updateEmbedRects.emit([]);
      this.signals.updateEmbedEditingState.emit(null);
      // }
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = this.viewportState;
    const max = scrollHeight - clientHeight;
    let top = e.deltaY / 2;
    if (top > 0) {
      if (Math.ceil(scrollTop) === max) return;

      top = Math.min(top, max - scrollTop);
    } else if (top < 0) {
      if (scrollTop === 0) return;

      top = Math.max(top, -scrollTop);
    }

    const { startPoint, endPoint } = this.selection.state;
    if (startPoint && endPoint) {
      e.preventDefault();

      this.viewportState.scrollTop += top;
      // FIXME: need smooth
      this.defaultViewportElement.scrollTop += top;

      endPoint.y += top;
      this.selection.updateSelectionRect(startPoint, endPoint);
      return;
    }

    // trigger native scroll
  };

  // See https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event
  // May need optimization
  // private _onResize = (_: Event) => {
  //   this.selection.refreshSelectedBlocksRects();
  // };

  private _onScroll = (e: Event) => {
    const type = this.selection.state.type;
    const { scrollLeft, scrollTop } = e.target as Element;
    this.viewportState.scrollLeft = scrollLeft;
    this.viewportState.scrollTop = scrollTop;
    if (type === 'block') {
      this.selection.refreshSelectionRectAndSelecting(this.viewportState);
      // Why? Clicling on the image and the `type` is set to `block`.
      // See _onContainerClick
      this.selection.refresEmbedRects();
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

  private _initDragHandle = () => {
    const createHandle = () => {
      this.components.dragHandle = createDragHandle(this);
      this.components.dragHandle.getDropAllowedBlocks = draggingBlock => {
        if (
          draggingBlock &&
          Utils.doesInsideBlockByFlavour(
            this.page,
            draggingBlock,
            'affine:database'
          )
        ) {
          return getAllowSelectedBlocks(
            this.page.getParent(draggingBlock) as BaseBlockModel
          );
        }
        return getAllowSelectedBlocks(this.model);
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
            this.selection?.refreshSelectedBlocksRects();
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
    const childrenContainer = BlockChildrenContainer(this.model, this, () =>
      this.requestUpdate()
    );
    const selectionRect = FrameSelectionRect(this.frameSelectionRect);
    const selectedRectsContainer = SelectedRectsContainer(
      this.selectedRects,
      this.viewportState
    );
    const selectedEmbedContainer = EmbedSelectedRectsContainer(
      this.selectEmbedRects,
      this.viewportState
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
          ${selectedRectsContainer}
          <div class="affine-default-page-block-title-container">
            <div
              placeholder="Title"
              data-block-is-title="true"
              class="affine-default-page-block-title"
            ></div>
          </div>
          ${childrenContainer}
        </div>
        ${selectionRect} ${selectedEmbedContainer} ${embedEditingContainer}
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
