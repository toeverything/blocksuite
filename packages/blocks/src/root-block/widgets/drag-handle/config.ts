import type {
  DragHandleOption,
  DropType,
} from '@blocksuite/affine-shared/services';
import type { Disposable, Rect } from '@blocksuite/global/utils';

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

export type DropResult = {
  rect: Rect | null;
  dropBlockId: string;
  dropType: DropType;
};

export class DragHandleOptionsRunner {
  private optionMap = new Map<DragHandleOption, number>();

  get options(): DragHandleOption[] {
    return Array.from(this.optionMap.keys());
  }

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
}
