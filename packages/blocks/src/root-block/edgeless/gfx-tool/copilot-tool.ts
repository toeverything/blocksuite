import type { PointerEventState } from '@blocksuite/block-std';

import { BaseTool } from '@blocksuite/block-std/gfx';
import { Bound, getCommonBoundWithRotation } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';

import {
  AFFINE_AI_PANEL_WIDGET,
  type AffineAIPanelWidget,
} from '../../widgets/ai-panel/ai-panel.js';

export class CopilotTool extends BaseTool {
  static override toolName: string = 'copilot';

  private _dragging = false;

  draggingAreaUpdated = new Slot<boolean | void>();

  dragLastPoint: [number, number] = [0, 0];

  dragStartPoint: [number, number] = [0, 0];

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
    const aiPanel = this.gfx.std.view.getWidget(
      AFFINE_AI_PANEL_WIDGET,
      this.doc.root!.id
    ) as AffineAIPanelWidget;
    return aiPanel && aiPanel.state !== 'hidden';
  }

  get selectedElements() {
    return this.gfx.selection.selectedElements;
  }

  private _initDragState(e: PointerEventState) {
    this.dragStartPoint = this.gfx.viewport.toModelCoord(e.x, e.y);
    this.dragLastPoint = this.dragStartPoint;
  }

  abort() {
    this._dragging = false;
    this.dragStartPoint = [0, 0];
    this.dragLastPoint = [0, 0];
    this.gfx.tool.setTool('default');
  }

  override activate(): void {
    this.gfx.viewport.locked = true;
  }

  override deactivate(): void {
    this.gfx.viewport.locked = false;
  }

  override dragEnd(): void {
    if (!this._dragging) return;

    this._dragging = false;
    this.draggingAreaUpdated.emit(true);
  }

  override dragMove(e: PointerEventState): void {
    if (!this._dragging) return;

    this.dragLastPoint = this.gfx.viewport.toModelCoord(e.x, e.y);

    const area = this.area;
    const bound = new Bound(area.x, area.y, area.width, area.height);

    if (area.width & area.height) {
      const elements = this.gfx.getElementsByBound(bound);

      const set = new Set(elements);

      this.gfx.selection.set({
        elements: Array.from(set).map(element => element.id),
        editing: false,
        inoperable: true,
      });
    }

    this.draggingAreaUpdated.emit();
  }

  override dragStart(e: PointerEventState): void {
    if (this.processing) return;

    this._initDragState(e);
    this._dragging = true;
    this.draggingAreaUpdated.emit();
  }

  onContainerPointerDown(e: PointerEventState): void {
    if (this.processing) {
      e.raw.stopPropagation();
      return;
    }

    this.gfx.tool.setTool('default');
  }

  updateDragPointsWith(
    selectedElements: BlockSuite.EdgelessModel[],
    padding = 0
  ) {
    const bounds = getCommonBoundWithRotation(selectedElements).expand(
      padding / this.gfx.viewport.zoom
    );

    this.dragStartPoint = bounds.tl as [number, number];
    this.dragLastPoint = bounds.br as [number, number];
  }

  updateSelectionWith(
    selectedElements: BlockSuite.EdgelessModel[],
    padding = 0
  ) {
    const { selection } = this.gfx;

    selection.clear();

    this.updateDragPointsWith(selectedElements, padding);

    selection.set({
      elements: selectedElements.map(e => e.id),
      editing: false,
      inoperable: true,
    });

    this.draggingAreaUpdated.emit(true);
  }
}

declare module '@blocksuite/block-std/gfx' {
  interface GfxToolsMap {
    copilot: CopilotTool;
  }
}
