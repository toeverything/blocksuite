import type { PointerEventState } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import type { Rect } from '../../__internal__/index.js';

export const DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT = 24;
export const DRAG_HANDLE_OFFSET_LEFT = 2;
export const DRAG_HANDLE_GRABBER_HEIGHT = 12;
export const DRAG_HANDLE_GRABBER_WIDTH = 4;
export const DRAG_HANDLE_GRABBER_BORDER_RADIUS = 4;
export const DRAG_HANDLE_GRABBER_MARGIN = 4;
export const NOTE_CONTAINER_PADDING = 24;
export const DRAG_HOVER_RECT_PADDING = 4;
export const HOVER_DRAG_HANDLE_GRABBER_WIDTH = 2;

export type DropResult = {
  rect: Rect | null;
  dropBlockId: string;
  dropBefore: boolean;
};

export type DragHandleOption = {
  flavour: string;
  onDragStart?: (
    state: PointerEventState,
    startDragging: (
      blockElements: BlockElement[],
      state: PointerEventState
    ) => void
  ) => boolean;
  onDragMove?: (
    state: PointerEventState,
    draggingElements?: BlockElement[]
  ) => boolean;
  onDragEnd?: (
    state: PointerEventState,
    draggingElements: BlockElement[]
  ) => boolean;
};

export class DragHandleOptionsRunner {
  options: DragHandleOption[] = [];

  register(option: DragHandleOption): Disposable {
    if (this.options.find(op => op.flavour === option.flavour))
      return { dispose() {} };

    this.options.push(option);
    return {
      dispose: () => {
        // TODO: Need a better way to remove options if there are no blocks of same flavour
        // this.options.splice(this.options.indexOf(option), 1);
      },
    };
  }
}
