import type { PointerEventState } from '@blocksuite/block-std';
import type { GfxModel } from '@blocksuite/block-std/gfx';

import type { DefaultTool } from '../default-tool.js';

export enum DefaultModeDragType {
  /** press alt/option key to clone selected  */
  AltCloning = 'alt-cloning',
  /** Moving connector label */
  ConnectorLabelMoving = 'connector-label-moving',
  /** Moving selected contents */
  ContentMoving = 'content-moving',
  /** Native range dragging inside active note block */
  NativeEditing = 'native-editing',
  /** Default void state */
  None = 'none',
  /** Dragging preview */
  PreviewDragging = 'preview-dragging',
  /** Expanding the dragging area, select the content covered inside */
  Selecting = 'selecting',
}

export type DragState = {
  movedElements: GfxModel[];
  dragType: DefaultModeDragType;
  event: PointerEventState;
};

export class DefaultToolExt {
  readonly supportedDragTypes: DefaultModeDragType[] = [];

  get gfx() {
    return this.defaultTool.gfx;
  }

  get std() {
    return this.defaultTool.std;
  }

  constructor(protected defaultTool: DefaultTool) {}

  click(_evt: PointerEventState) {}

  dblClick(_evt: PointerEventState) {}

  initDrag(_: DragState): {
    dragStart?: (evt: PointerEventState) => void;
    dragMove?: (evt: PointerEventState) => void;
    dragEnd?: (evt: PointerEventState) => void;
  } {
    return {};
  }

  mounted() {}

  pointerDown(_evt: PointerEventState) {}

  pointerMove(_evt: PointerEventState) {}

  pointerUp(_evt: PointerEventState) {}

  unmounted() {}
}
