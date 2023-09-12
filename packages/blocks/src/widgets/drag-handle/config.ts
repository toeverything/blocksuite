import type { PointerEventState } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';

export const DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT = 24;
export const DRAG_HANDLE_OFFSET_LEFT = 2;
export const DRAG_HANDLE_GRABBER_HEIGHT = 12;
export const DRAG_HANDLE_GRABBER_WIDTH = 4;
export const DRAG_HANDLE_GRABBER_BORDER_RADIUS = 4;
export const DRAG_HANDLE_GRABBER_MARGIN = 4;
export const NOTE_CONTAINER_PADDING = 24;
export const DRAG_HOVER_RECT_PADDING = 4;
export const HOVER_DRAG_HANDLE_GRABBER_WIDTH = 2;

export type IndicatorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type DropIndicator = {
  rect: IndicatorRect | null;
  dropBlockId: string;
  dropBefore: boolean;
};

export type DragHandleOption = {
  flavour: string;
  onDragStart: (state: PointerEventState) => boolean;
  onDragMove: (
    state: PointerEventState,
    dragging: boolean,
    draggingElements: BlockElement[],
    getDropIndicator: () => DropIndicator | null
  ) => boolean;
  onDragEnd: (
    state: PointerEventState,
    dragging: boolean,
    draggingElements: BlockElement[]
  ) => boolean;
};

export class DragHandleOptionsRunner {
  options: DragHandleOption[] = [];

  register(option: DragHandleOption) {
    if (this.options.find(op => op.flavour === option.flavour)) return;

    this.options.push(option);
  }
}
