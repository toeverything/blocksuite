import type { PointerEventState } from '@blocksuite/block-std';
import type {
  GfxLocalElementModel,
  GfxPrimitiveElementModel,
} from '@blocksuite/block-std/gfx';

import { Bound } from '@blocksuite/global/utils';

import { DefaultModeDragType, DefaultToolExt } from './ext.js';

export class CanvasElementEventExt extends DefaultToolExt {
  private _currentStackedElm: (
    | GfxPrimitiveElementModel
    | GfxLocalElementModel
  )[] = [];

  override supportedDragTypes: DefaultModeDragType[] = [
    DefaultModeDragType.None,
  ];

  private _executeInReverseOrder(
    callback: (elm: GfxPrimitiveElementModel | GfxLocalElementModel) => void,
    arr = this._currentStackedElm
  ): void {
    for (let i = arr.length - 1; i >= 0; i--) {
      callback(arr[i]);
    }
  }

  override click(_evt: PointerEventState): void {
    this._executeInReverseOrder(elm => elm.onClick?.(_evt));
  }

  override dblClick(_evt: PointerEventState): void {
    this._executeInReverseOrder(elm => elm.onDblClick?.(_evt));
  }

  override pointerDown(_evt: PointerEventState): void {
    this._executeInReverseOrder(elm => elm.onPointerDown?.(_evt));
  }

  override pointerMove(_evt: PointerEventState): void {
    const [x, y] = this.gfx.viewport.toModelCoord(_evt.x, _evt.y);
    const hoveredElm = this.gfx.grid.search(new Bound(x, y, 1, 1), {
      filter: ['canvas', 'local'],
    }) as (GfxPrimitiveElementModel | GfxLocalElementModel)[];
    const stackedElmMap = new Map(
      this._currentStackedElm.map((val, index) => [val, index])
    );

    this._executeInReverseOrder(elm => {
      if (stackedElmMap.has(elm)) {
        const idx = stackedElmMap.get(elm)!;
        this._currentStackedElm.splice(idx, 1);
        elm.onPointerMove?.(_evt);
      } else {
        elm.onPointerEnter?.(_evt);
      }
    }, hoveredElm);
    this._executeInReverseOrder(elm => elm.onPointerLeave?.(_evt));

    this._currentStackedElm = hoveredElm;
  }

  override pointerUp(_evt: PointerEventState): void {
    this._executeInReverseOrder(elm => elm.onPointerUp?.(_evt));
  }
}
