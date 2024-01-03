import { type Y } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { Bound } from '../utils/bound.js';
import { getBoundsWithRotation } from '../utils/math-utils.js';
import { deserializeXYWH, type SerializedXYWH } from '../utils/xywh.js';
import { local, updateDerivedProp, yfield } from './decorators.js';

export type BaseProps = {
  index: string;
};

export abstract class ElementModel<Props extends BaseProps = BaseProps> {
  static propsToY(props: Record<string, unknown>) {
    return props;
  }

  /**
   * When the ymap is not connected to the doc, the value cannot be accessed.
   * But sometimes we need to access the value when creating the element model, those temporary values are stored here.
   */
  protected _preserved: Map<string, unknown> = new Map();
  protected _stashed: Map<keyof Props, unknown>;
  protected _local: Map<string | symbol, unknown> = new Map();
  protected _onChange: (props: Record<string, { oldValue: unknown }>) => void;

  yMap: Y.Map<unknown>;
  surfaceModel!: SurfaceBlockModel;

  abstract rotate: number;

  abstract xywh: SerializedXYWH;

  abstract get type(): string;

  @yfield()
  index!: string;

  @local()
  display: boolean = true;

  @local()
  opacity: number = 1;

  constructor(options: {
    yMap: Y.Map<unknown>;
    model: SurfaceBlockModel;
    stashedStore: Map<unknown, unknown>;
    onChange: (props: Record<string, { oldValue: unknown }>) => void;
  }) {
    const { yMap, model, stashedStore, onChange } = options;

    this.yMap = yMap;
    this.surfaceModel = model;
    this._stashed = stashedStore as Map<keyof Props, unknown>;
    this._onChange = onChange;

    // base class property field is assigned before yMap is set
    // so we need to manually assign the default value here
    this.index = 'a0';
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

    const curVal = this.yMap.get(prop as string);
    const prototype = Object.getPrototypeOf(this);

    this._stashed.set(prop, curVal);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._stashed.get(prop),
      set: (value: unknown) => {
        const oldValue = this._stashed.get(prop);

        this._stashed.set(prop, value);
        this._onChange({ [prop]: { oldValue } });

        updateDerivedProp(prototype, prop as string, this);
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
