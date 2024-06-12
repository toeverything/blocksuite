import type { PointerEventState } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

import type {
  CopilotSelectionTool,
  EdgelessTool,
} from '../../../../_common/utils/index.js';
import { Bound, getElementsBound } from '../../../../surface-block/index.js';
import {
  AFFINE_AI_PANEL_WIDGET,
  type AffineAIPanelWidget,
} from '../../../widgets/ai-panel/ai-panel.js';
import { EdgelessToolController } from './index.js';

export class CopilotSelectionController extends EdgelessToolController<CopilotSelectionTool> {
  get selection() {
    return this._edgeless.service.selection;
  }

  get selectedElements() {
    return this.selection.selectedElements;
  }

  get area() {
    const start = new DOMPoint(this.dragStartPoint[0], this.dragStartPoint[1]);
    const end = new DOMPoint(this.dragLastPoint[0], this.dragLastPoint[1]);

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);

    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  // AI processing
  get processing() {
    const aiPanel = this._edgeless.host.view.getWidget(
      AFFINE_AI_PANEL_WIDGET,
      this._edgeless.doc.root!.id
    ) as AffineAIPanelWidget;
    return aiPanel && aiPanel.state !== 'hidden';
  }

  private _dragging = false;

  readonly tool = {
    type: 'copilot',
  } as CopilotSelectionTool;

  dragStartPoint: [number, number] = [0, 0];

  dragLastPoint: [number, number] = [0, 0];

  draggingAreaUpdated = new Slot<boolean | void>();

  private _initDragState(e: PointerEventState) {
    this.dragStartPoint = this._service.viewport.toModelCoord(e.x, e.y);
    this.dragLastPoint = this.dragStartPoint;
  }

  abort() {
    this._dragging = false;
    this.dragStartPoint = [0, 0];
    this.dragLastPoint = [0, 0];
    this._edgeless.tools.setEdgelessTool({ type: 'default' });
  }

  updateDragPointsWith(
    selectedElements: BlockSuite.EdgelessModelType[],
    padding = 0
  ) {
    const bounds = getElementsBound(
      selectedElements.map(e => e.elementBound)
    ).expand(padding / this._edgeless.service.zoom);

    this.dragStartPoint = bounds.tl as [number, number];
    this.dragLastPoint = bounds.br as [number, number];
  }

  updateSelectionWith(
    selectedElements: BlockSuite.EdgelessModelType[],
    padding = 0
  ) {
    const { selection } = this._edgeless.service;

    selection.clear();

    this.updateDragPointsWith(selectedElements, padding);

    selection.set({
      elements: selectedElements.map(e => e.id),
      editing: false,
      inoperable: true,
    });

    this.draggingAreaUpdated.emit(true);
  }

  override onContainerDragStart(e: PointerEventState): void {
    if (this.processing) return;

    this._initDragState(e);
    this._dragging = true;
    this.draggingAreaUpdated.emit();
  }

  override onContainerDragMove(e: PointerEventState): void {
    if (!this._dragging) return;

    this.dragLastPoint = this._service.viewport.toModelCoord(e.x, e.y);

    const area = this.area;
    const bound = new Bound(area.x, area.y, area.width, area.height);

    if (area.width & area.height) {
      const elements = this._service.pickElementsByBound(bound);

      const set = new Set(elements);

      this.selection.set({
        elements: Array.from(set).map(element => element.id),
        editing: false,
        inoperable: true,
      });
    }

    this.draggingAreaUpdated.emit();
  }

  override onContainerDragEnd(): void {
    if (!this._dragging) return;

    this._dragging = false;
    this.draggingAreaUpdated.emit(true);
  }

  onContainerPointerDown(e: PointerEventState): void {
    if (this.processing) {
      e.raw.stopPropagation();
      return;
    }

    this._edgeless.tools.setEdgelessTool({ type: 'default' });
  }

  onContainerClick(): void {}

  onContainerContextMenu(): void {}

  onContainerDblClick(): void {}

  onContainerTripleClick(): void {}

  onContainerMouseMove(): void {}

  onContainerMouseOut(): void {}

  onPressShiftKey(): void {}

  onPressSpaceBar(): void {}

  override beforeModeSwitch(edgelessTool?: EdgelessTool) {
    this._service.locked = edgelessTool?.type === 'copilot';
  }

  afterModeSwitch(): void {}
}
