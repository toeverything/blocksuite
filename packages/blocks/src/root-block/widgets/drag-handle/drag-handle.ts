import type { NoteBlockModel, RootBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import {
  findNoteBlockModel,
  getBlockComponentsExcludeSubtrees,
  getScrollContainer,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { getCurrentNativeRange } from '@blocksuite/affine-shared/utils';
import {
  PathFinder,
  type PointerEventState,
  type UIEventHandler,
  WidgetComponent,
} from '@blocksuite/block-std';
import {
  Bound,
  DisposableGroup,
  Point,
  throttle,
} from '@blocksuite/global/utils';
import { type BlockModel, BlockViewType, type Query } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { NoteBlockComponent } from '../../../note-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../root-block/edgeless/edgeless-root-block.js';
import type { GfxBlockModel } from '../../edgeless/block-model.js';
import type { EdgelessTool } from '../../edgeless/types.js';
import type { DragHandleOption, DropResult, DropType } from './config.js';

import {
  Rect,
  isInsideEdgelessEditor,
  isInsidePageEditor,
} from '../../../_common/utils/index.js';
import {
  getSelectedRect,
  isTopLevelBlock,
} from '../../../root-block/edgeless/utils/query.js';
import { PageRootBlockComponent } from '../../../root-block/page/page-root-block.js';
import { autoScroll } from '../../../root-block/text-selection/utils.js';
import { SpecProvider } from '../../../specs/utils/spec-provider.js';
import { DragPreview } from './components/drag-preview.js';
import { DropIndicator } from './components/drop-indicator.js';
import {
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL,
  DRAG_HANDLE_CONTAINER_PADDING,
  DRAG_HANDLE_CONTAINER_WIDTH,
  DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL,
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_HEIGHT,
  DRAG_HANDLE_GRABBER_WIDTH,
  DRAG_HANDLE_GRABBER_WIDTH_HOVERED,
  DRAG_HOVER_RECT_PADDING,
  DragHandleOptionsRunner,
  HOVER_AREA_RECT_PADDING_TOP_LEVEL,
} from './config.js';
import { styles } from './styles.js';
import {
  calcDropTarget,
  captureEventTarget,
  containBlock,
  containChildBlock,
  getClosestBlockByPoint,
  getClosestNoteBlock,
  getDragHandleContainerHeight,
  getDragHandleLeftPadding,
  getDuplicateBlocks,
  includeTextSelection,
  insideDatabaseTable,
  isBlockPathEqual,
  isOutOfNoteBlock,
  updateDragHandleClassName,
} from './utils.js';

export const AFFINE_DRAG_HANDLE_WIDGET = 'affine-drag-handle-widget';

@customElement(AFFINE_DRAG_HANDLE_WIDGET)
export class AffineDragHandleWidget extends WidgetComponent<
  RootBlockModel,
  EdgelessRootBlockComponent | PageRootBlockComponent
> {
  private _anchorBlockId = '';

  private _anchorBlockPath: string | null = null;

  private _anchorModelDisposables: DisposableGroup | null = null;

  private _calculatePreviewOffset = (
    blocks: BlockComponent[],
    state: PointerEventState
  ) => {
    const { top, left } = blocks[0].getBoundingClientRect();
    const previewOffset = new Point(state.raw.x - left, state.raw.y - top);
    return previewOffset;
  };

  private _calculateQuery = (selectedIds: string[]): Query => {
    const ids: Array<{ id: string; viewType: BlockViewType }> = selectedIds.map(
      id => ({
        id,
        viewType: BlockViewType.Display,
      })
    );

    // The ancestors of the selected blocks should be rendered as Bypass
    selectedIds.map(block => {
      let parent: string | null = block;
      do {
        if (!selectedIds.includes(parent)) {
          ids.push({ viewType: BlockViewType.Bypass, id: parent });
        }
        parent = this.doc.blockCollection.crud.getParent(parent);
      } while (parent && !ids.map(({ id }) => id).includes(parent));
    });

    // The children of the selected blocks should be rendered as Display
    const addChildren = (id: string) => {
      const children = this.doc.getBlock(id)?.model.children ?? [];
      children.forEach(child => {
        ids.push({ viewType: BlockViewType.Display, id: child.id });
        addChildren(child.id);
      });
    };
    selectedIds.forEach(addChildren);

    return {
      match: ids,
      mode: 'strict',
    };
  };

  private _canEditing = (noteBlock: BlockComponent) => {
    if (noteBlock.doc.id !== this.doc.id) return false;

    if (isInsidePageEditor(this.host)) return true;
    const edgelessRoot = this.rootComponent as EdgelessRootBlockComponent;

    const noteBlockId = noteBlock.path[noteBlock.path.length - 1];
    return (
      edgelessRoot.service.selection.editing &&
      edgelessRoot.service.selection.selectedIds[0] === noteBlockId
    );
  };

  private _changeCursorToGrabbing = () => {
    document.documentElement.classList.add('affine-drag-preview-grabbing');
  };

  private _checkTopLevelBlockSelection = () => {
    if (!this.isConnected) {
      return;
    }

    if (this.doc.readonly || isInsidePageEditor(this.host)) {
      this._hide();
      return;
    }

    const edgelessRoot = this.rootComponent as EdgelessRootBlockComponent;
    const editing = edgelessRoot.service.selection.editing;
    const selectedElements = edgelessRoot.service.selection.selectedElements;
    if (editing || selectedElements.length !== 1) {
      this._hide();
      return;
    }

    const selectedElement = selectedElements[0];
    if (!isTopLevelBlock(selectedElement)) {
      this._hide();
      return;
    }

    const flavour = selectedElement.flavour;
    const dragHandleOptions = this.optionRunner.getOption(flavour);
    if (!dragHandleOptions || !dragHandleOptions.edgeless) {
      this._hide();
      return;
    }

    const selections = edgelessRoot.service.selection.surfaceSelections;

    this._anchorBlockId = selectedElement.id;
    this._anchorBlockPath = selections[0].blockId;

    this._showDragHandleOnTopLevelBlocks().catch(console.error);
  };

  /**
   * When click on drag handle
   * Should select the block and show slash menu if current block is not selected
   * Should clear selection if current block is the first selected block
   */
  private _clickHandler: UIEventHandler = ctx => {
    if (!this._isHoverDragHandleVisible) return;

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    const insideDragHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
    if (!insideDragHandle) return;

    if (!this._anchorBlockId || !this._anchorBlockPath) return;

    const { selection } = this.host;
    const selectedBlocks = this.selectedBlocks;

    // Should clear selection if current block is the first selected block
    if (
      selectedBlocks.length > 0 &&
      !includeTextSelection(selectedBlocks) &&
      selectedBlocks[0].blockId === this._anchorBlockId
    ) {
      selection.clear(['block']);
      this._dragHoverRect = null;
      this._showDragHandleOnHoverBlock(this._anchorBlockPath);
      return;
    }

    // Should select the block if current block is not selected
    const blocks = this.anchorBlockComponent;
    if (!blocks) return;

    if (selectedBlocks.length > 1) {
      this._showDragHandleOnHoverBlock(this._anchorBlockPath);
    }

    this._setSelectedBlocks([blocks]);
  };

  private _createDragPreview = (
    blocks: BlockComponent[],
    state: PointerEventState,
    dragPreviewEl?: HTMLElement,
    dragPreviewOffset?: Point
  ): DragPreview => {
    let dragPreview: DragPreview;
    if (dragPreviewEl) {
      dragPreview = new DragPreview(dragPreviewOffset);
      dragPreview.append(dragPreviewEl);
    } else {
      let width = 0;
      blocks.forEach(element => {
        width = Math.max(width, element.getBoundingClientRect().width);
      });

      const selectedIds = blocks.map(block => block.model.id);

      const query = this._calculateQuery(selectedIds);

      const doc = this.doc.blockCollection.getDoc({ query });

      const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
      const previewTemplate = this.host.renderSpecPortal(
        doc,
        previewSpec.value
      );

      const offset = this._calculatePreviewOffset(blocks, state);
      const posX = state.raw.x - offset.x;
      const posY = state.raw.y - offset.y;
      const altKey = state.raw.altKey;

      dragPreview = new DragPreview(offset);
      dragPreview.template = previewTemplate;
      dragPreview.onRemove = () => {
        this.doc.blockCollection.clearQuery(query);
      };
      dragPreview.style.width = `${width / this.scale / this.noteScale / this.cumulativeParentScale}px`;
      dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${
        this.scale * this.noteScale
      })`;

      dragPreview.style.opacity = altKey ? '1' : '0.5';
    }
    this.rootComponent.append(dragPreview);
    return dragPreview;
  };

  private _createDropIndicator = () => {
    if (!this.dropIndicator) {
      this.dropIndicator = new DropIndicator();
      this.rootComponent.append(this.dropIndicator);
    }
  };

  /**
   * When drag end, should move blocks to drop position
   * @returns
   */
  private _dragEndHandler: UIEventHandler = ctx => {
    this._clearRaf();
    if (!this.dragging || !this.dragPreview) return false;
    if (this.draggingElements.length === 0 || this.doc.readonly) {
      this._hide(true);
      return false;
    }

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    if (!this.host.contains(target as Node)) {
      this._hide(true);
      return true;
    }

    for (const option of this.optionRunner.options) {
      if (
        option.onDragEnd?.({
          state,
          draggingElements: this.draggingElements,
          dropBlockId: this.dropBlockId,
          dropType: this.dropType,
          dragPreview: this.dragPreview,
          noteScale: this.noteScale,
          editorHost: this.host,
        })
      ) {
        this._hide(true);
        if (isInsideEdgelessEditor(this.host)) {
          this._checkTopLevelBlockSelection();
        }
        return true;
      }
    }

    // call default drag end handler if no option return true
    this._onDragEnd(state);

    if (isInsideEdgelessEditor(this.host)) {
      this._checkTopLevelBlockSelection();
    }

    return true;
  };

  /**
   * When dragging, should:
   * Update drag preview position
   * Update indicator position
   * Update drop block id
   */
  private _dragMoveHandler: UIEventHandler = ctx => {
    if (this._isHoverDragHandleVisible || this._isTopLevelDragHandleVisible) {
      this._hide();
    }

    if (!this.dragging || this.draggingElements.length === 0) {
      return false;
    }

    ctx.get('defaultState').event.preventDefault();
    const state = ctx.get('pointerState');

    for (const option of this.optionRunner.options) {
      if (option.onDragMove?.(state, this.draggingElements)) {
        return true;
      }
    }

    // call default drag move handler if no option return true
    return this._onDragMove(state);
  };

  /**
   * When start dragging, should set dragging elements and create drag preview
   */
  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    // If not click left button to start dragging, should do nothing
    const { button } = state.raw;
    if (button !== 0) {
      return false;
    }

    // call default drag start handler if no option return true
    for (const option of this.optionRunner.options) {
      if (
        option.onDragStart?.({
          state,
          startDragging: this._startDragging,
          anchorBlockId: this._anchorBlockId,
          anchorBlockPath: this._anchorBlockPath,
          editorHost: this.host,
        })
      ) {
        return true;
      }
    }
    return this._onDragStart(state);
  };

  private _getBlockComponentFromViewStore = (path: string) => {
    return this.host.view.getBlock(path);
  };

  private _getDraggingAreaRect = (block: BlockComponent): Rect => {
    // When hover block is in selected blocks, should show hover rect on the selected blocks
    // Top: the top of the first selected block
    // Left: the left of the first selected block
    // Right: the largest right of the selected blocks
    // Bottom: the bottom of the last selected block
    let { left, top, right, bottom } = block.getBoundingClientRect();

    const blocks = this._getHoveredBlocks();

    blocks.forEach(block => {
      left = Math.min(left, block.getBoundingClientRect().left);
      top = Math.min(top, block.getBoundingClientRect().top);
      right = Math.max(right, block.getBoundingClientRect().right);
      bottom = Math.max(bottom, block.getBoundingClientRect().bottom);
    });

    const offsetLeft = getDragHandleLeftPadding(blocks);

    const offsetParentRect =
      this.dragHandleContainerOffsetParent.getBoundingClientRect();
    if (!offsetParentRect) return new Rect(0, 0, 0, 0);

    left -= offsetParentRect.left;
    right -= offsetParentRect.left;
    top -= offsetParentRect.top;
    bottom -= offsetParentRect.top;

    left /= this.cumulativeParentScale;
    right /= this.cumulativeParentScale;
    top /= this.cumulativeParentScale;
    bottom /= this.cumulativeParentScale;

    // Add padding to hover rect
    left -=
      (DRAG_HANDLE_CONTAINER_WIDTH + offsetLeft) * this.scale * this.noteScale;
    top -= DRAG_HOVER_RECT_PADDING * this.scale;
    right += DRAG_HOVER_RECT_PADDING * this.scale;
    bottom += DRAG_HOVER_RECT_PADDING * this.scale;

    return new Rect(left, top, right, bottom);
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
    const blockPath = closestBlock.path;
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
      const parentElement = this._getBlockComponentFromViewStore(parent.id);
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
      containChildBlock(this.draggingElements, blockPath)
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
      this.scale * this.cumulativeParentScale,
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

  private _getHoveredBlocks = (): BlockComponent[] => {
    if (!this._isHoverDragHandleVisible || !this._anchorBlockPath) return [];

    const hoverBlock = this.anchorBlockComponent;
    if (!hoverBlock) return [];

    const selections = this.selectedBlocks;
    let blocks: BlockComponent[] = [];

    // When current selection is TextSelection, should cover all the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const range = getCurrentNativeRange();
      if (!range) return [];
      if (!this._rangeManager) return [];
      blocks = this._rangeManager.getSelectedBlockComponentsByRange(range, {
        match: el => el.model.role === 'content',
        mode: 'highest',
      });
    } else {
      blocks = this.selectedBlocks
        .map(block => this._getBlockComponentFromViewStore(block.blockId))
        .filter((block): block is BlockComponent => !!block);
    }

    if (
      containBlock(
        blocks.map(block => PathFinder.id(block.path)),
        this._anchorBlockPath
      )
    ) {
      return blocks;
    }

    return [hoverBlock];
  };

  // Need to consider block padding and scale
  private _getTopWithBlockComponent = (block: BlockComponent) => {
    const computedStyle = getComputedStyle(block);
    const { top } = block.getBoundingClientRect();
    const paddingTop = parseInt(computedStyle.paddingTop) * this.scale;
    return (
      (top +
        paddingTop -
        this.dragHandleContainerOffsetParent.getBoundingClientRect().top) /
      this.cumulativeParentScale
    );
  };

  private _handleAnchorModelDisposables = (blockModel: BlockModel) => {
    if (this._anchorModelDisposables) {
      this._anchorModelDisposables.dispose();
      this._anchorModelDisposables = null;
    }

    this._anchorModelDisposables = new DisposableGroup();
    this._anchorModelDisposables.add(
      blockModel.propsUpdated.on(() => this._hide())
    );

    this._anchorModelDisposables.add(blockModel.deleted.on(() => this._hide()));
  };

  private _handleEdgelessToolUpdated = (newTool: EdgelessTool) => {
    if (newTool.type === 'default') {
      this._checkTopLevelBlockSelection();
    } else {
      this._hide();
    }
  };

  private _handleEdgelessViewPortUpdated = ({
    zoom,
    center,
  }: {
    zoom: number;
    center: IVec;
  }) => {
    if (this.scale !== zoom) {
      this.scale = zoom;
      this._updateDragPreviewOnViewportUpdate();
    }

    if (this.center[0] !== center[0] && this.center[1] !== center[1]) {
      this.center = [...center];
      this._updateDropIndicatorOnScroll();
    }

    if (this._isTopLevelDragHandleVisible) {
      this._showDragHandleOnTopLevelBlocks().catch(console.error);
      this._updateDragHoverRectTopLevelBlock();
    } else {
      this._hide();
    }
  };

  private _hide = (force = false) => {
    updateDragHandleClassName();

    this._isHoverDragHandleVisible = false;
    this._isTopLevelDragHandleVisible = false;
    this._isDragHandleHovered = false;

    this._anchorBlockId = '';
    this._anchorBlockPath = null;

    if (this._dragHandleContainer) {
      this._dragHandleContainer.style.display = 'none';
    }

    if (force) {
      this._reset();
    }
  };

  /** Check if given block component is selected */
  private _isBlockSelected = (block?: BlockComponent) => {
    if (!block) return false;
    return this.selectedBlocks.some(
      selection => selection.blockId === block.model.id
    );
  };

  private _isDragHandleHovered = false;

  private _isHoverDragHandleVisible = false;

  private _isTopLevelDragHandleVisible = false;

  private _keyboardHandler: UIEventHandler = ctx => {
    if (!this.dragging || !this.dragPreview) {
      return;
    }

    const state = ctx.get('defaultState');
    const event = state.event as KeyboardEvent;
    event.preventDefault();
    event.stopPropagation();

    const altKey = event.key === 'Alt' && event.altKey;
    this.dragPreview.style.opacity = altKey ? '1' : '0.5';
  };

  private _lastHoveredBlockPath: string | null = null;

  private _lastShowedBlock: { path: string; el: BlockComponent } | null = null;

  private _onDragEnd = (state: PointerEventState) => {
    const targetBlockId = this.dropBlockId;
    const dropType = this.dropType;
    const draggingElements = this.draggingElements;
    this._hide(true);

    // handle drop of blocks from note onto edgeless container
    if (!targetBlockId) {
      const target = captureEventTarget(state.raw.target);
      if (!target) return false;

      const isTargetEdgelessContainer =
        target.classList.contains('edgeless-container');
      if (!isTargetEdgelessContainer) return false;

      const selectedBlocks = getBlockComponentsExcludeSubtrees(draggingElements)
        .map(element => element.model)
        .filter((x): x is BlockModel => !!x);
      if (selectedBlocks.length === 0) return false;

      const isSurfaceComponent = selectedBlocks.some(block => {
        const parent = this.doc.getParent(block.id);
        return matchFlavours(parent, ['affine:surface']);
      });
      if (isSurfaceComponent) return true;

      const edgelessRoot = this.rootComponent as EdgelessRootBlockComponent;

      const { left: viewportLeft, top: viewportTop } = edgelessRoot.viewport;

      const newNoteId = edgelessRoot.addNoteWithPoint(
        new Point(state.raw.x - viewportLeft, state.raw.y - viewportTop),
        {
          scale: this.noteScale,
        }
      );
      const newNoteBlock = this.doc.getBlockById(newNoteId) as NoteBlockModel;
      if (!newNoteBlock) return;

      const bound = Bound.deserialize(newNoteBlock.xywh);
      bound.h *= this.noteScale;
      bound.w *= this.noteScale;
      this.doc.updateBlock(newNoteBlock, {
        xywh: bound.serialize(),
        edgeless: {
          ...newNoteBlock.edgeless,
          scale: this.noteScale,
        },
      });

      const altKey = state.raw.altKey;
      if (altKey) {
        const duplicateBlocks = getDuplicateBlocks(selectedBlocks);

        this.doc.addBlocks(duplicateBlocks, newNoteBlock);
      } else {
        this.doc.moveBlocks(selectedBlocks, newNoteBlock);
      }

      edgelessRoot.service.selection.set({
        elements: [newNoteBlock.id],
        editing: true,
      });

      return true;
    }

    // Should make sure drop block id is not in selected blocks
    if (
      containBlock(
        this.selectedBlocks.map(selection => selection.blockId),
        targetBlockId
      )
    ) {
      return false;
    }

    const selectedBlocks = getBlockComponentsExcludeSubtrees(draggingElements)
      .map(element => element.model)
      .filter((x): x is BlockModel => !!x);
    if (!selectedBlocks.length) {
      return false;
    }

    const targetBlock = this.doc.getBlockById(targetBlockId);
    if (!targetBlock) return;

    const shouldInsertIn = dropType === 'in';

    const parent = shouldInsertIn
      ? targetBlock
      : this.doc.getParent(targetBlockId);
    if (!parent) return;

    const altKey = state.raw.altKey;

    if (shouldInsertIn) {
      if (altKey) {
        const duplicateBlocks = getDuplicateBlocks(selectedBlocks);

        this.doc.addBlocks(duplicateBlocks, targetBlock);
      } else {
        this.doc.moveBlocks(selectedBlocks, targetBlock);
      }
    } else {
      if (altKey) {
        const duplicateBlocks = getDuplicateBlocks(selectedBlocks);

        const parentIndex =
          parent.children.indexOf(targetBlock) + (dropType === 'after' ? 1 : 0);

        this.doc.addBlocks(duplicateBlocks, parent, parentIndex);
      } else {
        this.doc.moveBlocks(
          selectedBlocks,
          parent,
          targetBlock,
          dropType === 'before'
        );
      }
    }

    // TODO: need a better way to update selection
    // Should update selection after moving blocks
    // In doc page mode, update selected blocks
    // In edgeless mode, focus on the first block
    setTimeout(() => {
      if (!parent) return;
      // Need to update selection when moving blocks successfully
      // Because the block path may be changed after moving
      const parentElement = this._getBlockComponentFromViewStore(parent.id);
      if (parentElement) {
        const newSelectedBlocks = selectedBlocks.map(block => {
          return this.std.view.getBlock(block.id);
        });
        if (!newSelectedBlocks) return;

        const note = findNoteBlockModel(parentElement.model);
        if (!note) return;
        this._setSelectedBlocks(newSelectedBlocks as BlockComponent[], note.id);
      }
    }, 0);

    return true;
  };

  private _onDragHandlePointerDown = () => {
    if (!this._isHoverDragHandleVisible || !this._anchorBlockPath) return;

    const block = this.anchorBlockComponent;
    if (!block) return;

    this._dragHoverRect = this._getDraggingAreaRect(block) ?? null;
  };

  private _onDragHandlePointerEnter = () => {
    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    if (this._isHoverDragHandleVisible && this._anchorBlockPath) {
      const block = this.anchorBlockComponent;
      if (!block) return;

      const padding = DRAG_HANDLE_CONTAINER_PADDING * this.scale;
      container.style.paddingTop = `${padding}px`;
      container.style.paddingBottom = `${padding}px`;
      container.style.transition = `padding 0.25s ease`;

      grabber.style.width = `${
        DRAG_HANDLE_GRABBER_WIDTH_HOVERED * this.scale * this.noteScale
      }px`;
      grabber.style.borderRadius = `${
        DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale * this.noteScale
      }px`;

      this._isDragHandleHovered = true;
    } else if (this._isTopLevelDragHandleVisible) {
      const edgelessElement = this.anchorEdgelessElement;
      if (!edgelessElement) return;

      this._dragHoverRect =
        this._getHoverAreaRectTopLevelBlock(edgelessElement);
      this._isDragHandleHovered = true;
    }
  };

  private _onDragHandlePointerLeave = () => {
    this._isDragHandleHovered = false;
    this._dragHoverRect = null;

    if (this._isTopLevelDragHandleVisible) return;

    if (this.dragging) return;

    if (!this._anchorBlockPath) return;
    this._showDragHandleOnHoverBlock(this._anchorBlockPath);
  };

  private _onDragHandlePointerUp = () => {
    if (!this._isHoverDragHandleVisible) return;
    this._dragHoverRect = null;
  };

  private _onDragMove = (state: PointerEventState) => {
    this._clearRaf();

    this.rafID = requestAnimationFrame(() => {
      this._updateDragPreviewPosition(state);
      this._updateDropIndicator(state, true);
    });
    return true;
  };

  private _onDragStart = (state: PointerEventState) => {
    const event = state.raw;
    const { target } = event;
    const element = captureEventTarget(target);
    const insideDragHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
    // Should only start dragging when pointer down on drag handle
    // And current mouse button is left button
    if (!insideDragHandle) {
      this._hide();
      return false;
    }

    if (
      !this._isHoverDragHandleVisible ||
      !this._anchorBlockId ||
      !this._anchorBlockPath
    )
      return;
    // Get current hover block element by path
    const hoverBlock = this.anchorBlockComponent;
    if (!hoverBlock) return false;

    let selections = this.selectedBlocks;

    // When current selection is TextSelection
    // Should set BlockSelection for the blocks in native range
    if (selections.length > 0 && includeTextSelection(selections)) {
      const nativeSelection = document.getSelection();
      if (
        nativeSelection &&
        nativeSelection.rangeCount > 0 &&
        this._rangeManager
      ) {
        const range = nativeSelection.getRangeAt(0);
        const blocks = this._rangeManager.getSelectedBlockComponentsByRange(
          range,
          {
            match: el => el.model.role === 'content',
            mode: 'highest',
          }
        );
        this._setSelectedBlocks(blocks);
        selections = this.selectedBlocks;
      }
    }

    // When there is no selected blocks
    // Or selected blocks not including current hover block
    // Set current hover block as selected
    if (
      selections.length === 0 ||
      !containBlock(
        selections.map(selection => selection.blockId),
        this._anchorBlockId
      )
    ) {
      const block = this.anchorBlockComponent;
      if (block) {
        this._setSelectedBlocks([block]);
      }
    }

    const blocks = this.selectedBlocks
      .map(selection => {
        return this._getBlockComponentFromViewStore(selection.blockId);
      })
      .filter((element): element is BlockComponent<BlockModel> => !!element);

    // This could be skip if we can ensure that all selected blocks are on the same level
    // Which means not selecting parent block and child block at the same time
    const blocksExcludingChildren = getBlockComponentsExcludeSubtrees(
      blocks
    ) as BlockComponent[];

    if (blocksExcludingChildren.length === 0) return false;

    this._startDragging(blocksExcludingChildren, state);
    this._hide();
    return true;
  };

  /**
   * When pointer move on block, should show drag handle
   * And update hover block id and path
   */
  private _pointerMoveOnBlock = (state: PointerEventState) => {
    if (this._isTopLevelDragHandleVisible) return;

    const point = new Point(state.raw.x, state.raw.y);
    const closestBlock = getClosestBlockByPoint(
      this.host,
      this.rootComponent,
      point
    );
    if (!closestBlock) {
      this._anchorBlockId = '';
      this._anchorBlockPath = null;
      return;
    }

    const blockId = closestBlock.getAttribute(this.host.blockIdAttr);
    if (!blockId) return;

    this._anchorBlockId = blockId;
    this._anchorBlockPath = closestBlock.blockId;

    if (insideDatabaseTable(closestBlock) || this.doc.readonly) {
      this._hide();
      return;
    }

    // If current block is not the last hovered block, show drag handle beside the hovered block
    if (
      (!this._lastHoveredBlockPath ||
        !isBlockPathEqual(this._anchorBlockPath, this._lastHoveredBlockPath) ||
        !this._isHoverDragHandleVisible) &&
      !this._isDragHandleHovered
    ) {
      this._showDragHandleOnHoverBlock(this._anchorBlockPath);
      this._lastHoveredBlockPath = this._anchorBlockPath;
    }
  };

  private _pointerOutHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    state.raw.preventDefault();

    const { target } = state.raw;
    const element = captureEventTarget(target);
    if (!element) return;

    const { relatedTarget } = state.raw;
    // TODO: when pointer out of page viewport, should hide drag handle
    // But the pointer out event is not as expected
    // Need to be optimized
    const relatedElement = captureEventTarget(relatedTarget);
    const outOfPageViewPort = element.classList.contains(
      'affine-page-viewport'
    );
    const inPage = !!relatedElement?.closest('.affine-page-viewport');

    const inDragHandle = !!relatedElement?.closest(AFFINE_DRAG_HANDLE_WIDGET);
    if (outOfPageViewPort && !inDragHandle && !inPage) {
      this._hide();
    }
  };

  private _removeDragPreview = () => {
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
  };

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

    this._dragHoverRect = null;
    this._lastHoveredBlockPath = null;
    this._lastShowedBlock = null;
    this._anchorBlockId = '';
    this._anchorBlockPath = null;
    this._isHoverDragHandleVisible = false;
    this._isDragHandleHovered = false;
    this._isTopLevelDragHandleVisible = false;

    this._removeDragPreview();
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

  private _setSelectedBlocks = (blocks: BlockComponent[], noteId?: string) => {
    const { selection } = this.host;
    const selections = blocks.map(block =>
      selection.create('block', {
        blockId: block.blockId,
      })
    );

    // When current page is edgeless page
    // We need to remain surface selection and set editing as true
    if (isInsideEdgelessEditor(this.host)) {
      const surfaceElementId = noteId
        ? noteId
        : findNoteBlockModel(blocks[0].model)?.id;
      if (!surfaceElementId) return;
      const surfaceSelection = selection.create(
        'surface',
        blocks[0]!.blockId,
        [surfaceElementId],
        true
      );

      selections.push(surfaceSelection);
    }

    selection.set(selections);
  };

  // Multiple blocks: drag handle should show on the vertical middle of all blocks
  private _showDragHandleOnHoverBlock = (blockPath: string) => {
    const block = this._getBlockComponentFromViewStore(blockPath);
    if (!block) return;

    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    this._isHoverDragHandleVisible = true;

    const draggingAreaRect = this._getDraggingAreaRect(block);

    // Some blocks have padding, should consider padding when calculating position

    const containerHeight = getDragHandleContainerHeight(block.model);

    // Ad-hoc solution for list with toggle icon
    updateDragHandleClassName([block]);
    // End of ad-hoc solution

    const posTop = this._getTopWithBlockComponent(block);

    const rowPaddingY =
      ((containerHeight - DRAG_HANDLE_GRABBER_HEIGHT) / 2) *
      this.scale *
      this.noteScale;

    // use padding to control grabber's height
    const paddingTop = rowPaddingY + posTop - draggingAreaRect.top;
    const paddingBottom =
      draggingAreaRect.height -
      paddingTop -
      DRAG_HANDLE_GRABBER_HEIGHT * this.scale * this.noteScale;

    const applyStyle = (transition?: boolean) => {
      container.style.transition = transition ? 'padding 0.25s ease' : 'none';
      container.style.paddingTop = `${paddingTop}px`;
      container.style.paddingBottom = `${paddingBottom}px`;
      container.style.width = `${
        DRAG_HANDLE_CONTAINER_WIDTH * this.scale * this.noteScale
      }px`;
      container.style.left = `${draggingAreaRect.left}px`;
      container.style.top = `${draggingAreaRect.top}px`;
      container.style.display = 'flex';
      container.style.height = `${draggingAreaRect.height}px`;
    };

    if (isBlockPathEqual(block.blockId, this._lastShowedBlock?.path)) {
      applyStyle(true);
    } else if (this.selectedBlocks.length) {
      if (this._isBlockSelected(block))
        applyStyle(
          this._isDragHandleHovered &&
            this._isBlockSelected(this._lastShowedBlock?.el)
        );
      else applyStyle(false);
    } else {
      applyStyle(false);
    }

    grabber.style.width = `${
      DRAG_HANDLE_GRABBER_WIDTH * this.scale * this.noteScale
    }px`;
    grabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale * this.noteScale
    }px`;

    this._handleAnchorModelDisposables(block.model);
    if (!isBlockPathEqual(block.blockId, this._lastShowedBlock?.path)) {
      this._lastShowedBlock = {
        path: block.blockId,
        el: block,
      };
    }
  };

  private _showDragHandleOnTopLevelBlocks = async () => {
    if (isInsidePageEditor(this.host)) return;
    const edgelessRoot = this.rootComponent as EdgelessRootBlockComponent;
    await edgelessRoot.surface.updateComplete;

    if (!this._anchorBlockPath) return;
    const block = this.anchorBlockComponent;
    if (!block) return;

    const edgelessElement = edgelessRoot.service.getElementById(block.model.id);
    if (!edgelessElement) return;

    const container = this._dragHandleContainer;
    const grabber = this._dragHandleGrabber;
    if (!container || !grabber) return;

    const rect = getSelectedRect([edgelessElement]);
    const [left, top] = edgelessRoot.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const height = rect.height * this.scale;

    const posLeft =
      left -
      (DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL +
        DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL) *
        this.scale;

    const posTop = top;

    container.style.transition = 'none';
    container.style.paddingTop = `0px`;
    container.style.paddingBottom = `0px`;
    container.style.width = `${
      DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.scale
    }px`;
    container.style.left = `${posLeft}px`;
    container.style.top = `${posTop}px`;
    container.style.display = 'flex';
    container.style.height = `${height}px`;

    grabber.style.width = `${DRAG_HANDLE_GRABBER_WIDTH_HOVERED * this.scale}px`;
    grabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.scale
    }px`;

    this._handleAnchorModelDisposables(block.model);

    this._isTopLevelDragHandleVisible = true;
  };

  private _startDragging = (
    blocks: BlockComponent[],
    state: PointerEventState,
    dragPreviewEl?: HTMLElement,
    dragPreviewOffset?: Point
  ) => {
    if (!blocks.length) {
      return;
    }

    this.draggingElements = blocks;

    if (this.dragPreview) {
      this._removeDragPreview();
    }

    this.dragPreview = this._createDragPreview(
      blocks,
      state,
      dragPreviewEl,
      dragPreviewOffset
    );

    this.dragging = true;
    this._changeCursorToGrabbing();
    this._createDropIndicator();
    this._hide();
  };

  private _throttledPointerMoveHandler = throttle<UIEventHandler>(ctx => {
    if (this.doc.readonly || this.dragging || !this.isConnected) {
      this._hide();
      return;
    }
    if (this._isTopLevelDragHandleVisible) return;

    const state = ctx.get('pointerState');
    const { target } = state.raw;
    const element = captureEventTarget(target);
    // When pointer not on block or on dragging, should do nothing
    if (!element) return;

    // When pointer on drag handle, should do nothing
    if (element.closest('.affine-drag-handle-container')) return;

    // TODO: need to optimize
    // When pointer out of note block hover area or inside database, should hide drag handle
    const point = new Point(state.raw.x, state.raw.y);

    const closestNoteBlock = getClosestNoteBlock(
      this.host,
      this.rootComponent,
      point
    ) as NoteBlockComponent | null;

    this.noteScale = isInsidePageEditor(this.host)
      ? 1
      : (closestNoteBlock?.model.edgeless.scale ?? 1);

    if (
      closestNoteBlock &&
      this._canEditing(closestNoteBlock) &&
      !isOutOfNoteBlock(
        this.host,
        closestNoteBlock,
        point,
        this.scale * this.noteScale
      )
    ) {
      this._pointerMoveOnBlock(state);
      return true;
    }

    this._hide();
    return false;
  }, 1000 / 60);

  private _updateDragHoverRectTopLevelBlock = () => {
    if (!this._dragHoverRect) return;

    const edgelessElement = this.anchorEdgelessElement;

    if (edgelessElement) {
      this._dragHoverRect =
        this._getHoverAreaRectTopLevelBlock(edgelessElement);
    }
  };

  private _updateDragPreviewOnViewportUpdate = () => {
    if (this.dragPreview && this.lastDragPointerState) {
      this._updateDragPreviewPosition(this.lastDragPointerState);
    }
  };

  private _updateDragPreviewPosition = (state: PointerEventState) => {
    if (!this.dragPreview) return;

    const offsetParentRect =
      this.dragHandleContainerOffsetParent.getBoundingClientRect();

    const dragPreviewOffset = this.dragPreview.offset;

    let posX = state.raw.x - dragPreviewOffset.x - offsetParentRect.left;
    posX /= this.cumulativeParentScale;

    let posY = state.raw.y - dragPreviewOffset.y - offsetParentRect.top;
    posY /= this.cumulativeParentScale;

    this.dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${
      this.scale * this.noteScale
    })`;

    const altKey = state.raw.altKey;
    this.dragPreview.style.opacity = altKey ? '1' : '0.5';
  };

  private _updateDropIndicator = (
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
      isOutOfNoteBlock(this.host, closestNoteBlock, point, this.scale)
    ) {
      this._resetDropResult();
    } else {
      const dropResult = this._getDropResult(state);
      this._updateDropResult(dropResult);
    }

    this.lastDragPointerState = state;
    if (this.rootComponent instanceof PageRootBlockComponent) {
      if (!shouldAutoScroll) return;

      const result = autoScroll(this.scrollContainer, state.raw.y);
      if (!result) {
        this._clearRaf();
        return;
      }
      this.rafID = requestAnimationFrame(() =>
        this._updateDropIndicator(state, true)
      );
    } else {
      this._clearRaf();
    }
  };

  private _updateDropIndicatorOnScroll = () => {
    if (
      !this.dragging ||
      this.draggingElements.length === 0 ||
      !this.lastDragPointerState
    )
      return;

    const state = this.lastDragPointerState;
    this.rafID = requestAnimationFrame(() =>
      this._updateDropIndicator(state, false)
    );
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

      left /= this.cumulativeParentScale;
      top /= this.cumulativeParentScale;

      let { width, height } = dropResult.rect;
      width /= this.cumulativeParentScale;
      height /= this.cumulativeParentScale;

      const rect = Rect.fromLWTH(left, width, top, height);
      this.dropIndicator.rect = rect;
    } else {
      this.dropIndicator.rect = dropResult?.rect ?? null;
    }
  };

  static staticOptionRunner = new DragHandleOptionsRunner();

  static override styles = styles;

  // Single block: drag handle should show on the vertical middle of the first line of element
  center: IVec = [0, 0];

  cumulativeParentScale = 1;

  dragPreview: DragPreview | null = null;

  dragging = false;

  draggingElements: BlockComponent[] = [];

  dropBlockId = '';

  dropIndicator: DropIndicator | null = null;

  dropType: DropType | null = null;

  lastDragPointerState: PointerEventState | null = null;

  noteScale = 1;

  rafID = 0;

  scale = 1;

  static registerOption(option: DragHandleOption) {
    return AffineDragHandleWidget.staticOptionRunner.register(option);
  }

  private _clearRaf() {
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
      this.rafID = 0;
    }
  }

  private _getHoverAreaRectTopLevelBlock(
    edgelessElement: GfxBlockModel
  ): Rect | null {
    if (isInsidePageEditor(this.host)) return null;
    const edgelessRoot = this.rootComponent as EdgelessRootBlockComponent;

    const rect = getSelectedRect([edgelessElement]);
    let [left, top] = edgelessRoot.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const width = rect.width * this.scale;
    const height = rect.height * this.scale;

    let [right, bottom] = [left + width, top + height];

    const offsetLeft = DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL * this.scale;
    const padding = HOVER_AREA_RECT_PADDING_TOP_LEVEL * this.scale;

    left -= DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.scale + offsetLeft;
    top -= padding;
    right += padding;
    bottom += padding;

    return new Rect(left, top, right, bottom);
  }

  private get _rangeManager() {
    return this.std.range;
  }

  private get dragHandleContainerOffsetParent() {
    return this._dragHandleContainer.parentElement!;
  }

  private get scrollContainer() {
    return getScrollContainer(this.rootComponent!);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.addFromEvent(this, 'pointerdown', e => {
      e.preventDefault();
    });

    this.handleEvent('pointerMove', this._throttledPointerMoveHandler);
    this.handleEvent('click', this._clickHandler);
    this.handleEvent('dragStart', this._dragStartHandler);
    this.handleEvent('dragMove', this._dragMoveHandler);
    this.handleEvent('dragEnd', this._dragEndHandler, { global: true });
    this.handleEvent('pointerOut', this._pointerOutHandler);
    this.handleEvent('beforeInput', () => this._hide());
    this.handleEvent('keyDown', this._keyboardHandler, { global: true });
    this.handleEvent('keyUp', this._keyboardHandler, { global: true });
  }

  override disconnectedCallback() {
    this._hide(true);
    this._disposables.dispose();
    this._anchorModelDisposables?.dispose();
    super.disconnectedCallback();
  }

  override firstUpdated() {
    this._hide(true);

    // When pointer enter drag handle grabber
    // Extend drag handle grabber to the height of the hovered block
    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerenter',
      this._onDragHandlePointerEnter
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerdown',
      this._onDragHandlePointerDown
    );

    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerup',
      this._onDragHandlePointerUp
    );

    // When pointer leave drag handle grabber, should reset drag handle grabber style
    this._disposables.addFromEvent(
      this._dragHandleContainer,
      'pointerleave',
      this._onDragHandlePointerLeave
    );

    this._disposables.addFromEvent(this.host, 'pointerleave', () => {
      this._hide();
    });

    if (isInsidePageEditor(this.host)) {
      this._disposables.add(this.doc.slots.blockUpdated.on(() => this._hide()));

      const pageRoot = this.rootComponent as PageRootBlockComponent;
      this._disposables.add(
        pageRoot.slots.viewportUpdated.on(() => {
          this._hide();
          if (this.dropIndicator) {
            this.dropIndicator.rect = null;
          }
        })
      );

      this._disposables.addFromEvent(
        this.scrollContainer,
        'scrollend',
        this._updateDropIndicatorOnScroll
      );
    } else if (isInsideEdgelessEditor(this.host)) {
      const edgelessRoot = this.rootComponent as EdgelessRootBlockComponent;

      this._disposables.add(
        edgelessRoot.slots.edgelessToolUpdated.on(
          this._handleEdgelessToolUpdated
        )
      );

      this._disposables.add(
        edgelessRoot.service.viewport.viewportUpdated.on(
          this._handleEdgelessViewPortUpdated
        )
      );

      this._disposables.add(
        edgelessRoot.service.selection.slots.updated.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );

      this._disposables.add(
        edgelessRoot.slots.readonlyUpdated.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );

      this._disposables.add(
        edgelessRoot.slots.draggingAreaUpdated.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );

      this._disposables.add(
        edgelessRoot.slots.elementResizeStart.on(() => {
          this._hide();
        })
      );

      this._disposables.add(
        edgelessRoot.slots.elementResizeEnd.on(() => {
          this._checkTopLevelBlockSelection();
        })
      );
    }
  }

  override render() {
    const hoverRectStyle = styleMap(
      this._dragHoverRect
        ? {
            width: `${this._dragHoverRect.width}px`,
            height: `${this._dragHoverRect.height}px`,
            top: `${this._dragHoverRect.top}px`,
            left: `${this._dragHoverRect.left}px`,
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

  get anchorBlockComponent(): BlockComponent | null {
    if (!this._anchorBlockPath) return null;
    return this._getBlockComponentFromViewStore(this._anchorBlockPath);
  }

  get anchorEdgelessElement(): GfxBlockModel | null {
    if (isInsidePageEditor(this.host) || !this._anchorBlockId) return null;
    const { service } = this.rootComponent as EdgelessRootBlockComponent;
    const edgelessElement = service.getElementById(this._anchorBlockId);
    return isTopLevelBlock(edgelessElement) ? edgelessElement : null;
  }

  get optionRunner() {
    return AffineDragHandleWidget.staticOptionRunner;
  }

  get rootComponent() {
    return this.block as PageRootBlockComponent | EdgelessRootBlockComponent;
  }

  get selectedBlocks() {
    // eslint-disable-next-line unicorn/prefer-array-some
    return this.host.selection.find('text')
      ? this.host.selection.filter('text')
      : this.host.selection.filter('block');
  }

  @query('.affine-drag-handle-container')
  private accessor _dragHandleContainer!: HTMLDivElement;

  @query('.affine-drag-handle-grabber')
  private accessor _dragHandleGrabber!: HTMLDivElement;

  @state()
  private accessor _dragHoverRect: {
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
