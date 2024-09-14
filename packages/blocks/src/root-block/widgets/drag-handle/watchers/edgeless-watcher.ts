import type { PointerEventState } from '@blocksuite/block-std';

import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { type IVec, Rect } from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';

import type {
  EdgelessRootBlockComponent,
  EdgelessRootService,
  EdgelessTool,
} from '../../../edgeless/index.js';
import type { AffineDragHandleWidget } from '../drag-handle.js';

import {
  getSelectedRect,
  isTopLevelBlock,
} from '../../../edgeless/utils/query.js';
import {
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL,
  DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL,
  DRAG_HANDLE_GRABBER_BORDER_RADIUS,
  DRAG_HANDLE_GRABBER_WIDTH_HOVERED,
  HOVER_AREA_RECT_PADDING_TOP_LEVEL,
} from '../config.js';

export class EdgelessWatcher {
  private _handleEdgelessToolUpdated = (newTool: EdgelessTool) => {
    if (newTool.type === 'default') {
      this.checkTopLevelBlockSelection();
    } else {
      this.widget.hide();
    }
  };

  private _handleEdgelessViewPortUpdated = ({
    zoom,
    center,
  }: {
    zoom: number;
    center: IVec;
  }) => {
    if (this.widget.scale.peek() !== zoom) {
      this.widget.scale.value = zoom;
      this._updateDragPreviewOnViewportUpdate();
    }

    if (
      this.widget.center[0] !== center[0] &&
      this.widget.center[1] !== center[1]
    ) {
      this.widget.center = [...center];
      this.widget.updateDropIndicatorOnScroll();
    }

    if (this.widget.isTopLevelDragHandleVisible) {
      this._showDragHandleOnTopLevelBlocks().catch(console.error);
      this._updateDragHoverRectTopLevelBlock();
    } else {
      this.widget.hide();
    }
  };

  private _showDragHandleOnTopLevelBlocks = async () => {
    if (this.widget.mode === 'page') return;
    const { edgelessRoot } = this;
    await edgelessRoot.surface.updateComplete;

    if (!this.widget.anchorBlockId) return;
    const block = this.widget.anchorBlockComponent.peek();
    if (!block) return;

    const edgelessElement = edgelessRoot.service.getElementById(block.model.id);
    if (!edgelessElement) return;

    const container = this.widget.dragHandleContainer;
    const grabber = this.widget.dragHandleGrabber;
    if (!container || !grabber) return;

    const rect = getSelectedRect([edgelessElement]);
    const [left, top] = edgelessRoot.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const height = rect.height * this.widget.scale.peek();

    const posLeft =
      left -
      (DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL +
        DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL) *
        this.widget.scale.peek();

    const posTop = top;

    container.style.transition = 'none';
    container.style.paddingTop = `0px`;
    container.style.paddingBottom = `0px`;
    container.style.width = `${
      DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.widget.scale.peek()
    }px`;
    container.style.left = `${posLeft}px`;
    container.style.top = `${posTop}px`;
    container.style.display = 'flex';
    container.style.height = `${height}px`;

    grabber.style.width = `${DRAG_HANDLE_GRABBER_WIDTH_HOVERED * this.widget.scale.peek()}px`;
    grabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.widget.scale.peek()
    }px`;

    this.widget.handleAnchorModelDisposables(block.model);

    this.widget.isTopLevelDragHandleVisible = true;
  };

  private _updateDragHoverRectTopLevelBlock = () => {
    if (!this.widget.dragHoverRect) return;

    this.widget.dragHoverRect = this.hoverAreaRectTopLevelBlock.value;
  };

  private _updateDragPreviewOnViewportUpdate = () => {
    if (this.widget.dragPreview && this.widget.lastDragPointerState) {
      this.updateDragPreviewPosition(this.widget.lastDragPointerState);
    }
  };

  checkTopLevelBlockSelection = () => {
    if (!this.widget.isConnected) return;

    if (this.widget.doc.readonly || this.widget.mode === 'page') {
      this.widget.hide();
      return;
    }

    const { edgelessRoot } = this;
    const editing = edgelessRoot.service.selection.editing;
    const selectedElements = edgelessRoot.service.selection.selectedElements;
    if (editing || selectedElements.length !== 1) {
      this.widget.hide();
      return;
    }

    const selectedElement = selectedElements[0];
    if (!isTopLevelBlock(selectedElement)) {
      this.widget.hide();
      return;
    }

    const flavour = selectedElement.flavour;
    const dragHandleOptions = this.widget.optionRunner.getOption(flavour);
    if (!dragHandleOptions || !dragHandleOptions.edgeless) {
      this.widget.hide();
      return;
    }

    this.widget.anchorBlockId.value = selectedElement.id;

    this._showDragHandleOnTopLevelBlocks().catch(console.error);
  };

  hoverAreaRectTopLevelBlock = computed(() => {
    const edgelessElement = this.widget.anchorEdgelessElement.value;

    if (!edgelessElement) return null;
    const { edgelessRoot } = this;
    const rect = getSelectedRect([edgelessElement]);
    let [left, top] = edgelessRoot.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );

    const scale = this.widget.scale.value;

    const width = rect.width * scale;
    const height = rect.height * scale;

    let [right, bottom] = [left + width, top + height];

    const offsetLeft = DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL * scale;
    const padding = HOVER_AREA_RECT_PADDING_TOP_LEVEL * scale;

    left -= DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * scale + offsetLeft;
    top -= padding;
    right += padding;
    bottom += padding;

    return new Rect(left, top, right, bottom);
  });

  updateDragPreviewPosition = (state: PointerEventState) => {
    if (!this.widget.dragPreview) return;

    const offsetParentRect =
      this.widget.dragHandleContainerOffsetParent.getBoundingClientRect();

    const dragPreviewOffset = this.widget.dragPreview.offset;

    const posX = state.raw.x - dragPreviewOffset.x - offsetParentRect.left;

    const posY = state.raw.y - dragPreviewOffset.y - offsetParentRect.top;

    this.widget.dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${this.widget.scaleInNote.peek()})`;

    const altKey = state.raw.altKey;
    this.widget.dragPreview.style.opacity = altKey ? '1' : '0.5';
  };

  get edgelessRoot() {
    return this.widget.rootComponent as EdgelessRootBlockComponent;
  }

  constructor(readonly widget: AffineDragHandleWidget) {}

  watch() {
    const { disposables, std } = this.widget;
    const gfxController = std.get(GfxControllerIdentifier);
    const { viewport } = gfxController;
    const edgelessService = std.getService(
      'affine:page'
    ) as EdgelessRootService;
    const edgelessSlots = edgelessService.slots;

    disposables.add(
      viewport.viewportUpdated.on(this._handleEdgelessViewPortUpdated)
    );

    disposables.add(
      edgelessService.selection.slots.updated.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );

    disposables.add(
      edgelessSlots.edgelessToolUpdated.on(this._handleEdgelessToolUpdated)
    );

    disposables.add(
      edgelessSlots.readonlyUpdated.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );

    disposables.add(
      edgelessSlots.draggingAreaUpdated.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );

    disposables.add(
      edgelessSlots.elementResizeStart.on(() => {
        this.widget.hide();
      })
    );

    disposables.add(
      edgelessSlots.elementResizeEnd.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );
  }
}
