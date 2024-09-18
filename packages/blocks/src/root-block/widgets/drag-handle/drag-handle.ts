import type { RootBlockModel } from '@blocksuite/affine-model';
import type { GfxBlockElementModel } from '@blocksuite/block-std/gfx';
import type { IVec } from '@blocksuite/global/utils';

import {
  DocModeProvider,
  DragHandleConfigIdentifier,
  type DropType,
} from '@blocksuite/affine-shared/services';
import {
  getScrollContainer,
  isInsideEdgelessEditor,
  isInsidePageEditor,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import {
  type BlockComponent,
  type PointerEventState,
  WidgetComponent,
} from '@blocksuite/block-std';
import { DisposableGroup, Point, Rect } from '@blocksuite/global/utils';
import { computed, type ReadonlySignal, signal } from '@preact/signals-core';
import { html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../../edgeless/index.js';
import type { DragPreview } from './components/drag-preview.js';
import type { DropIndicator } from './components/drop-indicator.js';
import type { DropResult } from './config.js';
import type { AFFINE_DRAG_HANDLE_WIDGET } from './consts.js';

import { isTopLevelBlock } from '../../../root-block/edgeless/utils/query.js';
import { autoScroll } from '../../../root-block/text-selection/utils.js';
import { DragHandleOptionsRunner } from './config.js';
import { PreviewHelper } from './helpers/preview-helper.js';
import { RectHelper } from './helpers/rect-helper.js';
import { SelectionHelper } from './helpers/selection-helper.js';
import { styles } from './styles.js';
import {
  calcDropTarget,
  containBlock,
  containChildBlock,
  getClosestBlockByPoint,
  getClosestNoteBlock,
  isOutOfNoteBlock,
  updateDragHandleClassName,
} from './utils.js';
import { DragEventWatcher } from './watchers/drag-event-watcher.js';
import { EdgelessWatcher } from './watchers/edgeless-watcher.js';
import { HandleEventWatcher } from './watchers/handle-event-watcher.js';
import { KeyboardEventWatcher } from './watchers/keyboard-event-watcher.js';
import { PageWatcher } from './watchers/page-watcher.js';
import { PointerEventWatcher } from './watchers/pointer-event-watcher.js';

export class AffineDragHandleWidget extends WidgetComponent<RootBlockModel> {
  static override styles = styles;

  private _anchorModelDisposables: DisposableGroup | null = null;

  private _dragEventWatcher = new DragEventWatcher(this);

  private _getBlockView = (blockId: string) => {
    return this.host.view.getBlock(blockId);
  };

  /**
   * When dragging, should update indicator position and target drop block id
   */
  private _getDropResult = (state: PointerEventState): DropResult | null => {
    const point = new Point(state.raw.x, state.raw.y);
    const closestBlock = getClosestBlockByPoint(
      this.host,
      this.rootComponent,
      point
    );
    if (!closestBlock) return null;

    const blockId = closestBlock.model.id;
    const model = closestBlock.model;

    const isDatabase = matchFlavours(model, ['affine:database']);
    if (isDatabase) return null;

    // note block can only be dropped into another note block
    // prevent note block from being dropped into other blocks
    const isDraggedElementNote =
      this.draggingElements.length === 1 &&
      matchFlavours(this.draggingElements[0].model, ['affine:note']);

    if (isDraggedElementNote) {
      const parent = this.std.doc.getParent(closestBlock.model);
      if (!parent) return null;
      const parentElement = this._getBlockView(parent.id);
      if (!parentElement) return null;
      if (!matchFlavours(parentElement.model, ['affine:note'])) return null;
    }

    // Should make sure that target drop block is
    // neither within the dragging elements
    // nor a child-block of any dragging elements
    if (
      containBlock(
        this.draggingElements.map(block => block.model.id),
        blockId
      ) ||
      containChildBlock(this.draggingElements, model)
    ) {
      return null;
    }

    let rect = null;
    let dropType: DropType = 'before';

    const result = calcDropTarget(
      point,
      model,
      closestBlock,
      this.draggingElements,
      this.scale.peek(),
      isDraggedElementNote === false
    );

    if (result) {
      rect = result.rect;
      dropType = result.dropType;
    }

    if (isDraggedElementNote && dropType === 'in') return null;

    const dropIndicator = {
      rect,
      dropBlockId: blockId,
      dropType,
    };

    return dropIndicator;
  };

  private _handleEventWatcher = new HandleEventWatcher(this);

  private _keyboardEventWatcher = new KeyboardEventWatcher(this);

  private _pageWatcher = new PageWatcher(this);

  private _removeDropIndicator = () => {
    if (this.dropIndicator) {
      this.dropIndicator.remove();
      this.dropIndicator = null;
    }
  };

  private _reset = () => {
    this.draggingElements = [];
    this.dropBlockId = '';
    this.dropType = null;
    this.lastDragPointerState = null;
    this.rafID = 0;
    this.dragging = false;

    this.dragHoverRect = null;
    this.anchorBlockId.value = null;
    this.isDragHandleHovered = false;
    this.isHoverDragHandleVisible = false;
    this.isTopLevelDragHandleVisible = false;

    this.pointerEventWatcher.reset();

    this.previewHelper.removeDragPreview();
    this._removeDropIndicator();
    this._resetCursor();
  };

  private _resetCursor = () => {
    document.documentElement.classList.remove('affine-drag-preview-grabbing');
  };

  private _resetDropResult = () => {
    this.dropBlockId = '';
    this.dropType = null;
    if (this.dropIndicator) this.dropIndicator.rect = null;
  };

  private _updateDropResult = (dropResult: DropResult | null) => {
    if (!this.dropIndicator) return;
    this.dropBlockId = dropResult?.dropBlockId ?? '';
    this.dropType = dropResult?.dropType ?? null;
    if (dropResult?.rect) {
      const offsetParentRect =
        this.dragHandleContainerOffsetParent.getBoundingClientRect();
      let { left, top } = dropResult.rect;
      left -= offsetParentRect.left;
      top -= offsetParentRect.top;

      const { width, height } = dropResult.rect;

      const rect = Rect.fromLWTH(left, width, top, height);
      this.dropIndicator.rect = rect;
    } else {
      this.dropIndicator.rect = dropResult?.rect ?? null;
    }
  };

  anchorBlockComponent = computed<BlockComponent | null>(() => {
    if (!this.anchorBlockId.value) return null;

    return this.std.view.getBlock(this.anchorBlockId.value);
  });

  anchorBlockId = signal<string | null>(null);

  anchorEdgelessElement: ReadonlySignal<GfxBlockElementModel | null> = computed(
    () => {
      if (!this.anchorBlockId.value) return null;
      if (this.mode === 'page') return null;

      const service = this.std.getService('affine:page') as EdgelessRootService;
      const edgelessElement = service.getElementById(this.anchorBlockId.value);
      return isTopLevelBlock(edgelessElement) ? edgelessElement : null;
    }
  );

  // Single block: drag handle should show on the vertical middle of the first line of element
  center: IVec = [0, 0];

  dragging = false;

  rectHelper = new RectHelper(this);

  draggingAreaRect: ReadonlySignal<Rect | null> = computed(
    this.rectHelper.getDraggingAreaRect
  );

  draggingElements: BlockComponent[] = [];

  dragPreview: DragPreview | null = null;

  dropBlockId = '';

  dropIndicator: DropIndicator | null = null;

  dropType: DropType | null = null;

  edgelessWatcher = new EdgelessWatcher(this);

  handleAnchorModelDisposables = () => {
    const block = this.anchorBlockComponent.peek();
    if (!block) return;
    const blockModel = block.model;

    if (this._anchorModelDisposables) {
      this._anchorModelDisposables.dispose();
      this._anchorModelDisposables = null;
    }

    this._anchorModelDisposables = new DisposableGroup();
    this._anchorModelDisposables.add(
      blockModel.propsUpdated.on(() => this.hide())
    );

    this._anchorModelDisposables.add(blockModel.deleted.on(() => this.hide()));
  };

  hide = (force = false) => {
    updateDragHandleClassName();

    this.isHoverDragHandleVisible = false;
    this.isTopLevelDragHandleVisible = false;
    this.isDragHandleHovered = false;

    this.anchorBlockId.value = null;

    if (this.dragHandleContainer) {
      this.dragHandleContainer.style.display = 'none';
    }

    if (force) {
      this._reset();
    }
  };

  isDragHandleHovered = false;

  isHoverDragHandleVisible = false;

  isTopLevelDragHandleVisible = false;

  lastDragPointerState: PointerEventState | null = null;

  noteScale = signal(1);

  readonly optionRunner = new DragHandleOptionsRunner();

  pointerEventWatcher = new PointerEventWatcher(this);

  previewHelper = new PreviewHelper(this);

  rafID = 0;

  scale = signal(1);

  scaleInNote = computed(() => this.scale.value * this.noteScale.value);

  selectionHelper = new SelectionHelper(this);

  updateDropIndicator = (
    state: PointerEventState,
    shouldAutoScroll: boolean = false
  ) => {
    const point = new Point(state.raw.x, state.raw.y);
    const closestNoteBlock = getClosestNoteBlock(
      this.host,
      this.rootComponent,
      point
    );
    if (
      !closestNoteBlock ||
      isOutOfNoteBlock(this.host, closestNoteBlock, point, this.scale.peek())
    ) {
      this._resetDropResult();
    } else {
      const dropResult = this._getDropResult(state);
      this._updateDropResult(dropResult);
    }

    this.lastDragPointerState = state;
    if (this.mode === 'page') {
      if (!shouldAutoScroll) return;

      const scrollContainer = getScrollContainer(this.rootComponent);
      const result = autoScroll(scrollContainer, state.raw.y);
      if (!result) {
        this.clearRaf();
        return;
      }
      this.rafID = requestAnimationFrame(() =>
        this.updateDropIndicator(state, true)
      );
    } else {
      this.clearRaf();
    }
  };

  updateDropIndicatorOnScroll = () => {
    if (
      !this.dragging ||
      this.draggingElements.length === 0 ||
      !this.lastDragPointerState
    )
      return;

    const state = this.lastDragPointerState;
    this.rafID = requestAnimationFrame(() =>
      this.updateDropIndicator(state, false)
    );
  };

  get dragHandleContainerOffsetParent() {
    return this.dragHandleContainer.parentElement!;
  }

  get mode() {
    return this.std.get(DocModeProvider).getEditorMode();
  }

  get rootComponent() {
    return this.block;
  }

  clearRaf() {
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
      this.rafID = 0;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.std.provider.getAll(DragHandleConfigIdentifier).forEach(config => {
      this.optionRunner.register(config);
    });

    this.pointerEventWatcher.watch();
    this._keyboardEventWatcher.watch();
    this._dragEventWatcher.watch();
  }

  override disconnectedCallback() {
    this.hide(true);
    this._disposables.dispose();
    this._anchorModelDisposables?.dispose();
    super.disconnectedCallback();
  }

  override firstUpdated() {
    this.hide(true);
    this._disposables.addFromEvent(this.host, 'pointerleave', () => {
      this.hide();
    });

    this._handleEventWatcher.watch();

    if (isInsidePageEditor(this.host)) {
      this._pageWatcher.watch();
    } else if (isInsideEdgelessEditor(this.host)) {
      this.edgelessWatcher.watch();
    }
  }

  override render() {
    const hoverRectStyle = styleMap(
      this.dragHoverRect
        ? {
            width: `${this.dragHoverRect.width}px`,
            height: `${this.dragHoverRect.height}px`,
            top: `${this.dragHoverRect.top}px`,
            left: `${this.dragHoverRect.left}px`,
          }
        : {
            display: 'none',
          }
    );

    return html`
      <div class="affine-drag-handle-widget">
        <div class="affine-drag-handle-container">
          <div class="affine-drag-handle-grabber"></div>
        </div>
        <div class="affine-drag-hover-rect" style=${hoverRectStyle}></div>
      </div>
    `;
  }

  @query('.affine-drag-handle-container')
  accessor dragHandleContainer!: HTMLDivElement;

  @query('.affine-drag-handle-grabber')
  accessor dragHandleGrabber!: HTMLDivElement;

  @state()
  accessor dragHoverRect: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_DRAG_HANDLE_WIDGET]: AffineDragHandleWidget;
  }
}
