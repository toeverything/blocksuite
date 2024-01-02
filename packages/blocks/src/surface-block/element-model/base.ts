import { type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { Bound } from '../utils/bound.js';
import { getBoundsWithRotation } from '../utils/math-utils.js';
import { deserializeXYWH, type SerializedXYWH } from '../utils/xywh.js';
import { ymap } from './decorators.js';

export type BaseProps = {
  index: string;
};

export abstract class ElementModel<Props extends BaseProps = BaseProps> {
  static propsToYStruct(props: Record<string, unknown>) {
    return props;
  }

  private _deferedInit!: {
    key: string;
    value: unknown;
  }[];
  private _stashed: Map<keyof Props, unknown>;
  protected _onchange: (props: Record<string, { oldValue: unknown }>) => void;
  protected _localStore: Map<string | symbol, unknown> = new Map();

  yMap: Y.Map<unknown>;
  surfaceModel!: SurfaceBlockModel;

  abstract rotate: number;

  abstract xywh: SerializedXYWH;

  abstract get type(): string;

  @ymap()
  index: string = 'a0';

  constructor(options: {
    yMap: Y.Map<unknown>;
    model: SurfaceBlockModel;
    stashedStore: Map<unknown, unknown>;
    onchange: (props: Record<string, { oldValue: unknown }>) => void;
  }) {
    const { yMap, model, stashedStore, onchange } = options;

    this.yMap = yMap;
    this.surfaceModel = model;
    this._stashed = stashedStore as Map<keyof Props, unknown>;
    this._onchange = onchange;

    this._deferedInit?.forEach(({ key, value }) => {
      // @ts-ignore
      this.yMap.set(key, value);
    });
    this._deferedInit = [];
  }

  get deserializedXYWH() {
    return deserializeXYWH(this.xywh);
  }

  get x() {
    return this.deserializedXYWH[0];
  }

  get y() {
    return this.deserializedXYWH[1];
  }

  get w() {
    return this.deserializedXYWH[2];
  }

  get h() {
    return this.deserializedXYWH[3];
  }

  get group() {
    return this.surfaceModel.getGroup(this.id);
  }

  get id() {
    return this.yMap.get('id') as string;
  }

  get elementBound() {
    if (this.rotate) {
      return Bound.from(getBoundsWithRotation(this));
    }

    return Bound.deserialize(this.xywh);
  }

  stash(prop: keyof Props) {
    if (this._stashed.has(prop)) {
      return;
    }

    const Ctor = Object.getPrototypeOf(this).constructor as typeof ElementModel;
    const curVal = this.yMap.get(prop as string);

    this._stashed.set(prop, curVal);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._stashed.get(prop),
      set: (value: unknown) => {
        const converted = (Ctor.propsToYStruct ?? ElementModel.propsToYStruct)({
          [prop]: value,
        }) as Record<keyof Props, unknown>;
        const oldValue = this._stashed.get(prop);

        this._stashed.set(prop, converted[prop]);
        this._onchange({ [prop]: { oldValue } });
      },
    });
  }

  pop(prop: keyof Props) {
    if (!this._stashed.has(prop)) {
      return;
    }

    const value = this._stashed.get(prop);
    this._stashed.delete(prop);
    // @ts-ignore
    delete this[prop];
    this.yMap.set(prop as string, value);
  }
}
