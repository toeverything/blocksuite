import { type Y } from '@blocksuite/store';

import type { SerializedXYWH } from '../index.js';
import type { SurfaceBlockModel } from '../surface-model.js';

function MagicProps(): {
  new <Props>(): Props;
} {
  // @ts-ignore
  return class {};
}

export type BaseProps = {
  xywh: SerializedXYWH;
};

// @ts-ignore
export class ElementModel<
  Props extends BaseProps = BaseProps,
> extends MagicProps()<Props> {
  private _stashed: Map<keyof Props, unknown>;
  yMap!: Y.Map<unknown>;
  surfaceModel!: SurfaceBlockModel;

  constructor(
    yMap: Y.Map<unknown>,
    model: SurfaceBlockModel,
    stashedStore: Map<unknown, unknown>
  ) {
    super();
    this.yMap = yMap;
    this.surfaceModel = model;
    this._stashed = stashedStore as Map<keyof Props, unknown>;
  }

  get type() {
    return this.yMap.get('type') as string;
  }

  get id() {
    return this.yMap.get('id') as string;
  }

  stash(prop: keyof Props) {
    if (this._stashed.has(prop)) {
      return;
    }

    this._stashed.set(prop, this.yMap.get(prop as string));
  }

  pop(prop: keyof Props) {
    if (!this._stashed.has(prop)) {
      return;
    }

    const value = this._stashed.get(prop);
    this._stashed.delete(prop);
    this.yMap.set(prop as string, value);
  }
}
