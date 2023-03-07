/// <reference types="vite/client" />
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { Utils } from '@blocksuite/store';
import { BaseBlockModel, DisposableGroup, Page, Slot } from '@blocksuite/store';
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
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { NonShadowLitElement } from '../../__internal__/utils/lit.js';
import type { DragHandle } from '../../components/index.js';
import type { PageBlockModel } from '../index.js';
import { bindHotkeys, removeHotkeys } from '../utils/bind-hotkey.js';
import { deleteModelsByRange, tryUpdateFrameSize } from '../utils/index.js';
import {
  DraggingArea,
  EmbedEditingContainer,
  EmbedSelectedRectsContainer,
  SelectedRectsContainer,
} from './components.js';
import { DefaultSelectionManager } from './selection-manager/index.js';
import {
  createDragHandle,
  getAllowSelectedBlocks,
  isControlledKeyboardEvent,
} from './utils.js';

export interface EmbedEditingState {
  position: { x: number; y: number };
  model: BaseBlockModel;
}

export interface DefaultSelectionSlots {
  draggingAreaUpdated: Slot<DOMRect | null>;
  selectedRectsUpdated: Slot<DOMRect[]>;
  embedRectsUpdated: Slot<DOMRect[]>;
  embedEditingStateUpdated: Slot<EmbedEditingState | null>;
  codeBlockOptionUpdated?: Slot;
  nativeSelectionToggled: Slot<boolean>;
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

    /*
    .affine-default-page-block-title-container {
    }
    */
  `;

  @property()
  page!: Page;

  flavour = 'affine:page' as const;

  selection!: DefaultSelectionManager;

  getService = getService;

  lastSelectionPosition: SelectionPosition = 'start';

  /**
   * Shared components
   */
  components = {
    dragHandle: <DragHandle | null>null,
  };

  @property()
  mouseRoot!: HTMLElement;

  @state()
  private _draggingArea: DOMRect | null = null;

  @state()
  private _selectedRects: DOMRect[] = [];

  @state()
  private _selectedEmbedRects: DOMRect[] = [];

  @state()
  private _embedEditingState!: EmbedEditingState | null;

  private _resizeObserver: ResizeObserver | null = null;

  @query('.affine-default-viewport')
  viewportElement!: HTMLDivElement;

  slots: DefaultSelectionSlots = {
    draggingAreaUpdated: new Slot<DOMRect | null>(),
    selectedRectsUpdated: new Slot<DOMRect[]>(),
    embedRectsUpdated: new Slot<DOMRect[]>(),
    embedEditingStateUpdated: new Slot<EmbedEditingState | null>(),
    nativeSelectionToggled: new Slot<boolean>(),
  };

  @property({ hasChanged: () => true })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  private _titleContainer!: HTMLElement;
  private _titleVEditor: VEditor | null = null;

  get titleVEditor() {
    assertExists(this._titleVEditor);
    return this._titleVEditor;
  }

  private _initTitleVEditor() {
    const { model } = this;
    const title = model.title;

    this._titleVEditor = new VEditor(title.yText);
    this._titleVEditor.mount(this._titleContainer);
    this._titleVEditor.bindHandlers({
      keydown: this._onTitleKeyDown,
    });

    this.model.title.yText.observe(() => {
      this.page.workspace.setPageMeta(this.page.id, {
        title: this.model.title.toString(),
      });
      this.requestUpdate();
    });
    this._titleVEditor.focusEnd();
    this._titleVEditor.setReadonly(this.page.readonly);
  }

  private _onTitleKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) {
      return;
    }
    const hasContent = !this.page.isEmpty;
    const { page, model } = this;
    const defaultFrame = model.children[0];

    if (e.key === 'Enter' && hasContent) {
      e.preventDefault();
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
      return;
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
      return;
    }
  };

  // TODO: disable it on scroll's threshold
  private _onWheel = (e: WheelEvent) => {
    const { selection } = this;
    const { state } = selection;
    const { type, viewport } = state;

    if (type === 'native') {
      return;
    }

    if (type === 'block') {
      const { viewportElement } = this;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const max = scrollHeight - clientHeight;
      let top = e.deltaY / 2;
      if (top > 0) {
        if (Math.ceil(scrollTop) === max) return;

        top = Math.min(top, max - scrollTop);
      } else if (top < 0) {
        if (scrollTop === 0) return;

        top = Math.max(top, -scrollTop);
      }

      const { draggingArea } = state;
      if (draggingArea) {
        e.preventDefault();

        viewport.scrollTop += top;
        // FIXME: need smooth
        viewportElement.scrollTop += top;

        draggingArea.end.y += top;
        selection.updateDraggingArea(draggingArea);
      }
    }

    // trigger native scroll
  };

  private _onScroll = (e: Event) => {
    const { selection } = this;
    const { type, viewport } = selection.state;
    const { scrollLeft, scrollTop } = e.target as Element;
    viewport.scrollLeft = scrollLeft;
    viewport.scrollTop = scrollTop;

    if (type === 'block') {
      selection.refreshDraggingArea(viewport);
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
    if (changedProperties.has('model')) {
      if (this.model && !this._titleVEditor) {
        this._initTitleVEditor();
      }
    }
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('page')) {
      this.selection = new DefaultSelectionManager({
        page: this.page,
        mouseRoot: this.mouseRoot,
        slots: this.slots,
        container: this,
      });
    }

    super.update(changedProperties);
  }

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

        // handle user input
        const blockRange = getCurrentBlockRange(this.page);
        if (
          !blockRange ||
          blockRange.models.length === 0 ||
          blockRange.type !== 'Native'
        ) {
          return;
        }
        const startBlock = blockRange.models[0];
        const richText = getRichTextByModel(startBlock);
        if (richText) {
          const vEditor = richText.vEditor;
          if (vEditor) {
            vEditor.insertText(
              {
                index: blockRange.startOffset,
                length: 0,
              },
              e.key
            );
            vEditor.setVRange({
              index: blockRange.startOffset + 1,
              length: 0,
            });
          }
        }
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
      this.page.awarenessStore.slots.update.subscribe(
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

  private _initSlotEffects() {
    const { slots } = this;

    slots.draggingAreaUpdated.on(rect => {
      this._draggingArea = rect;
    });
    slots.selectedRectsUpdated.on(rects => {
      this._selectedRects = rects;
    });
    slots.embedRectsUpdated.on(rects => {
      this._selectedEmbedRects = rects;
      if (rects.length === 0) {
        this._embedEditingState = null;
      }
    });
    slots.embedEditingStateUpdated.on(embedEditingState => {
      this._embedEditingState = embedEditingState;
    });
    slots.nativeSelectionToggled.on(flag => {
      if (flag) window.addEventListener('keydown', this._handleNativeKeydown);
      else window.removeEventListener('keydown', this._handleNativeKeydown);
    });

    this.model.page.slots.blockUpdated.on(() => {
      // TODO: optimize
      this.requestUpdate();
    });
  }

  private _initFrameSizeEffect() {
    tryUpdateFrameSize(this.page, 1);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateFrameSize(this.page, 1);
    });
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        for (const { target } of entries) {
          if (target === this.viewportElement) {
            this.selection.updateViewport();
            this.selection.updateRects();
            break;
          }
        }
      }
    );
    resizeObserver.observe(this.viewportElement);
    this._resizeObserver = resizeObserver;
  }

  firstUpdated() {
    const { page, selection, slots } = this;

    bindHotkeys(page, selection, slots);
    hotkey.enableHotkey();

    this._initSlotEffects();
    this._initFrameSizeEffect();
    this._initResizeEffect();

    this.viewportElement.addEventListener('wheel', this._onWheel);
    this.viewportElement.addEventListener('scroll', this._onScroll);

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
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this.viewportElement.removeEventListener('wheel', this._onWheel);
    this.viewportElement.removeEventListener('scroll', this._onScroll);
  }

  render() {
    const { page, selection } = this;
    const { viewport } = selection.state;

    const childrenContainer = BlockChildrenContainer(this.model, this, () =>
      this.requestUpdate()
    );
    const draggingArea = DraggingArea(this._draggingArea);
    const selectedRectsContainer = SelectedRectsContainer(
      this._selectedRects,
      viewport
    );
    const selectedEmbedContainer = EmbedSelectedRectsContainer(
      this._selectedEmbedRects,
      viewport
    );
    const embedEditingContainer = EmbedEditingContainer(
      page.readonly ? null : this._embedEditingState,
      this.slots,
      viewport
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
        ${selectedRectsContainer} ${draggingArea} ${selectedEmbedContainer}
        ${embedEditingContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-default-page': DefaultPageBlockComponent;
  }
}
