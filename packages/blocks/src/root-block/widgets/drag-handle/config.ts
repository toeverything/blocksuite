import type { PointerEventState } from '@blocksuite/block-std';
import type { BlockElement, EditorHost } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';

import type { Point, Rect } from '../../../_common/utils/index.js';
import type { DragPreview } from './components/drag-preview.js';

export const DRAG_HANDLE_CONTAINER_HEIGHT = 24;
export const DRAG_HANDLE_CONTAINER_WIDTH = 16;
export const DRAG_HANDLE_CONTAINER_WIDTH_TOP_LEVEL = 8;
export const DRAG_HANDLE_CONTAINER_OFFSET_LEFT = 2;
export const DRAG_HANDLE_CONTAINER_OFFSET_LEFT_LIST = 18;
export const DRAG_HANDLE_CONTAINER_OFFSET_LEFT_TOP_LEVEL = 5;
export const DRAG_HANDLE_CONTAINER_PADDING = 8;

export const DRAG_HANDLE_GRABBER_HEIGHT = 12;
export const DRAG_HANDLE_GRABBER_WIDTH = 4;
export const DRAG_HANDLE_GRABBER_WIDTH_HOVERED = 2;
export const DRAG_HANDLE_GRABBER_BORDER_RADIUS = 4;
export const DRAG_HANDLE_GRABBER_MARGIN = 4;

export const HOVER_AREA_RECT_PADDING_TOP_LEVEL = 6;

export const NOTE_CONTAINER_PADDING = 24;
export const EDGELESS_NOTE_EXTRA_PADDING = 20;
export const DRAG_HOVER_RECT_PADDING = 4;

export type DropType = 'after' | 'before' | 'in';
export type DropResult = {
  dropBlockId: string;
  dropType: DropType;
  rect: Rect | null;
};

export type OnDragStartProps = {
  anchorBlockId: string;
  anchorBlockPath: null | string;
  editorHost: EditorHost;
  startDragging: (
    blockElements: BlockElement[],
    state: PointerEventState,
    dragPreview?: HTMLElement,
    dragPreviewOffset?: Point
  ) => void;
  state: PointerEventState;
};

export type OnDragEndProps = {
  dragPreview: DragPreview;
  draggingElements: BlockElement[];
  dropBlockId: string;
  dropType: DropType | null;
  editorHost: EditorHost;
  noteScale: number;
  state: PointerEventState;
};

export type DragHandleOption = {
  edgeless?: boolean;
  flavour: RegExp | string;
  onDragEnd?: (props: OnDragEndProps) => boolean;
  onDragMove?: (
    state: PointerEventState,
    draggingElements?: BlockElement[]
  ) => boolean;
  onDragStart?: (props: OnDragStartProps) => boolean;
};

export class DragHandleOptionsRunner {
  private optionMap = new Map<DragHandleOption, number>();

  private _decreaseOptionCount(option: DragHandleOption) {
    const count = this.optionMap.get(option) || 0;
    if (count > 1) {
      this.optionMap.set(option, count - 1);
    } else {
      this.optionMap.delete(option);
    }
  }

  private _getExistingOptionWithSameFlavour(
    option: DragHandleOption
  ): DragHandleOption | undefined {
    return Array.from(this.optionMap.keys()).find(
      op => op.flavour === option.flavour
    );
  }

  getOption(flavour: string): DragHandleOption | undefined {
    return this.options.find(option => {
      if (typeof option.flavour === 'string') {
        return option.flavour === flavour;
      } else {
        return option.flavour.test(flavour);
      }
    });
  }

  register(option: DragHandleOption): Disposable {
    const currentOption =
      this._getExistingOptionWithSameFlavour(option) || option;
    const count = this.optionMap.get(currentOption) || 0;
    this.optionMap.set(currentOption, count + 1);

    return {
      dispose: () => {
        this._decreaseOptionCount(currentOption);
      },
    };
  }

  get options(): DragHandleOption[] {
    return Array.from(this.optionMap.keys());
  }
}
