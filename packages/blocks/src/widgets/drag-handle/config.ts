import type { PointerEventState } from '@blocksuite/block-std';

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

export type OptionRegistration = {
  onDragStart: (state: PointerEventState) => boolean;
  onDragEnd: (state: PointerEventState) => boolean;
};

export class OptionsRunner {
  options: OptionRegistration[] = [];

  add(registration: OptionRegistration) {
    this.options.push(registration);
  }
}
