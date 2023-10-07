import type { PointerEventState } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import type { Rect } from '../../../_common/utils/index.js';

export const DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT = 24;
export const DRAG_HANDLE_OFFSET_LEFT = 2;
export const LIST_DRAG_HANDLE_OFFSET_LEFT = 18;
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
  dropIn: boolean;
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
  private optionMap: Map<DragHandleOption, number> = new Map();

  get options(): DragHandleOption[] {
    return Array.from(this.optionMap.keys());
  }

  register(option: DragHandleOption): Disposable {
    const currentOption =
      this.getExistingOptionWithSameFlavour(option) || option;
    const count = this.optionMap.get(currentOption) || 0;
    this.optionMap.set(currentOption, count + 1);

    return {
      dispose: () => {
        this.decreaseOptionCount(currentOption);
      },
    };
  }

  private getExistingOptionWithSameFlavour(
    option: DragHandleOption
  ): DragHandleOption | undefined {
    return Array.from(this.optionMap.keys()).find(
      op => op.flavour === option.flavour
    );
  }

  private decreaseOptionCount(option: DragHandleOption) {
    const count = this.optionMap.get(option) || 0;
    if (count > 1) {
      this.optionMap.set(option, count - 1);
    } else {
      this.optionMap.delete(option);
    }
  }
}
