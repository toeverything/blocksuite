import type { PointerEventState } from '@blocksuite/block-std';

import { isInsidePageEditor } from '@blocksuite/affine-shared/utils';
import { type IVec, Rect } from '@blocksuite/global/utils';

import type { GfxBlockModel } from '../../../edgeless/block-model.js';
import type {
  EdgelessRootBlockComponent,
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
    if (this.widget.scale !== zoom) {
      this.widget.scale = zoom;
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
    if (isInsidePageEditor(this.widget.host)) return;
    const { edgelessRoot } = this;
    await edgelessRoot.surface.updateComplete;

    if (!this.widget.anchorBlockId) return;
    const block = this.widget.anchorBlockComponent;
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
    const height = rect.height * this.widget.scale;

    const posLeft =
      left -
      (DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL +
        DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL) *
        this.widget.scale;

    const posTop = top;

    container.style.transition = 'none';
    container.style.paddingTop = `0px`;
    container.style.paddingBottom = `0px`;
    container.style.width = `${
      DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.widget.scale
    }px`;
    container.style.left = `${posLeft}px`;
    container.style.top = `${posTop}px`;
    container.style.display = 'flex';
    container.style.height = `${height}px`;

    grabber.style.width = `${DRAG_HANDLE_GRABBER_WIDTH_HOVERED * this.widget.scale}px`;
    grabber.style.borderRadius = `${
      DRAG_HANDLE_GRABBER_BORDER_RADIUS * this.widget.scale
    }px`;

    this.widget.handleAnchorModelDisposables(block.model);

    this.widget.isTopLevelDragHandleVisible = true;
  };

  private _updateDragHoverRectTopLevelBlock = () => {
    if (!this.widget.dragHoverRect) return;

    const edgelessElement = this.widget.anchorEdgelessElement;

    if (edgelessElement) {
      this.widget.dragHoverRect =
        this._getHoverAreaRectTopLevelBlock(edgelessElement);
    }
  };

  private _updateDragPreviewOnViewportUpdate = () => {
    if (this.widget.dragPreview && this.widget.lastDragPointerState) {
      this.updateDragPreviewPosition(this.widget.lastDragPointerState);
    }
  };

  _getHoverAreaRectTopLevelBlock = (
    edgelessElement: GfxBlockModel
  ): Rect | null => {
    if (isInsidePageEditor(this.widget.host)) return null;
    const { edgelessRoot } = this;

    const rect = getSelectedRect([edgelessElement]);
    let [left, top] = edgelessRoot.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const width = rect.width * this.widget.scale;
    const height = rect.height * this.widget.scale;

    let [right, bottom] = [left + width, top + height];

    const offsetLeft =
      DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL * this.widget.scale;
    const padding = HOVER_AREA_RECT_PADDING_TOP_LEVEL * this.widget.scale;

    left -=
      DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL * this.widget.scale + offsetLeft;
    top -= padding;
    right += padding;
    bottom += padding;

    return new Rect(left, top, right, bottom);
  };

  checkTopLevelBlockSelection = () => {
    if (!this.widget.isConnected) {
      return;
    }

    if (this.widget.doc.readonly || isInsidePageEditor(this.widget.host)) {
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

    this.widget.anchorBlockId = selectedElement.id;

    this._showDragHandleOnTopLevelBlocks().catch(console.error);
  };

  updateDragPreviewPosition = (state: PointerEventState) => {
    if (!this.widget.dragPreview) return;

    const offsetParentRect =
      this.widget.dragHandleContainerOffsetParent.getBoundingClientRect();

    const dragPreviewOffset = this.widget.dragPreview.offset;

    const posX = state.raw.x - dragPreviewOffset.x - offsetParentRect.left;

    const posY = state.raw.y - dragPreviewOffset.y - offsetParentRect.top;

    this.widget.dragPreview.style.transform = `translate(${posX}px, ${posY}px) scale(${
      this.widget.scale * this.widget.noteScale
    })`;

    const altKey = state.raw.altKey;
    this.widget.dragPreview.style.opacity = altKey ? '1' : '0.5';
  };

  get edgelessRoot() {
    return this.widget.rootComponent as EdgelessRootBlockComponent;
  }

  constructor(readonly widget: AffineDragHandleWidget) {}

  watch() {
    const { edgelessRoot } = this;
    const { disposables } = this.widget;
    disposables.add(
      edgelessRoot.slots.edgelessToolUpdated.on(this._handleEdgelessToolUpdated)
    );

    disposables.add(
      edgelessRoot.service.viewport.viewportUpdated.on(
        this._handleEdgelessViewPortUpdated
      )
    );

    disposables.add(
      edgelessRoot.service.selection.slots.updated.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );

    disposables.add(
      edgelessRoot.slots.readonlyUpdated.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );

    disposables.add(
      edgelessRoot.slots.draggingAreaUpdated.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );

    disposables.add(
      edgelessRoot.slots.elementResizeStart.on(() => {
        this.widget.hide();
      })
    );

    disposables.add(
      edgelessRoot.slots.elementResizeEnd.on(() => {
        this.checkTopLevelBlockSelection();
      })
    );
  }
}
