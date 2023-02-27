/// <reference types="vite/client" />
import { BLOCK_ID_ATTR, SCROLL_THRESHOLD } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { Utils } from '@blocksuite/store';
import {
  BaseBlockModel,
  DisposableGroup,
  Page,
  Signal,
  Text,
} from '@blocksuite/store';
import autosize from 'autosize';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  asyncFocusRichText,
  BlockChildrenContainer,
  type BlockHost,
  getCurrentNativeRange,
  getRichTextByModel,
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
  private frameSelectionRect: DOMRect | null = null;

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
  private selectedRects: DOMRect[] = [];

  @state()
  private selectedEmbedRects: DOMRect[] = [];

  @state()
  private embedEditingState!: EmbedEditingState | null;

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
  private _title!: HTMLTextAreaElement;

  private async _onTitleKeyDown(e: KeyboardEvent) {
    const hasContent = !this.page.isEmpty;
    const { page, model, _title } = this;
    if (e.key === 'Enter' && !e.isComposing && hasContent) {
      assertExists(_title.selectionStart);
      const titleCursorIndex = _title.selectionStart;
      const contentLeft = _title.value.slice(0, titleCursorIndex);
      const contentRight = _title.value.slice(titleCursorIndex);

      const defaultFrame = model.children[0];
      const props = {
        flavour: 'affine:paragraph',
        text: new Text(contentRight),
      };
      // Fixes: https://github.com/toeverything/blocksuite/pull/1008
      //  A workaround that fixes rich-text still be listened when press enter on title.
      //  Other solutions like `quill.disable()` or remove all listener when blur will won't work.
      const block = defaultFrame.children.find(block =>
        getRichTextByModel(block)
      );
      if (block) {
        await asyncFocusRichText(this.page, block.id);
      }
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
      selection.refreshEmbedRects(this.embedEditingState);
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
    autosize(this._title);

    bindHotkeys(this.page, this.selection, this.signals);

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
      this.selectedEmbedRects = rects;
      if (rects.length === 0) {
        this.embedEditingState = null;
      }
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
    focusTextEnd(this._title);
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
    const selectionRect = FrameSelectionRect(this.frameSelectionRect);
    const selectedRectsContainer = SelectedRectsContainer(
      this.selectedRects,
      this.viewportState
    );
    const selectedEmbedContainer = EmbedSelectedRectsContainer(
      this.selectedEmbedRects,
      this.viewportState
    );
    const embedEditingContainer = EmbedEditingContainer(
      readonly ? null : this.embedEditingState,
      this.signals,
      this.viewportState
    );
    const codeBlockOptionContainer = CodeBlockOptionContainer(
      readonly ? null : this.codeBlockOption
    );

    return html`
      <div class="affine-default-viewport">
        <div class="affine-default-page-block-container">
          ${selectedRectsContainer}
          <div class="affine-default-page-block-title-container">
            <textarea
              ?disabled=${this.readonly}
              .value=${this.model.title}
              placeholder="Title"
              data-block-is-title="true"
              class="affine-default-page-block-title"
              @keydown=${this._onTitleKeyDown}
              @input=${this._onTitleInput}
            ></textarea>
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
