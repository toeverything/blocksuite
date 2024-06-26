import type { EdgelessSelectedRect } from '../../../root-block/edgeless/components/rects/edgeless-selected-rect/edgeless-selected-rect.js';
import type { HandleDirection } from '../../../root-block/edgeless/components/resize/resize-handles.js';
import type { Bound, PointLocation } from '../../../surface-block/index.js';

export type TransformControllerContext = {
  direction: HandleDirection;
  bound: Bound;
  rect: EdgelessSelectedRect;
  path?: PointLocation[];
  matrix?: DOMMatrix;
  shiftKey: boolean;
};

export type TransformControllerOptions = {
  rotatable: boolean;
  proportional: boolean;
  autoComplete: boolean;
};
export abstract class EdgelessTransformController<
  Model extends BlockSuite.EdgelessModelType,
> {
  readonly rotatable: boolean;

  readonly proportional: boolean;

  readonly autoComplete: boolean;

  rotate?: (
    element: Model,
    data: Omit<TransformControllerContext, 'direction'>
  ) => void;

  constructor(options?: Partial<TransformControllerOptions>) {
    const {
      rotatable = false,
      proportional = false,
      autoComplete = false,
    } = options ?? {
      proportional: false,
      rotatable: false,
      autoComplete: false,
    };
    this.rotatable = rotatable;
    this.proportional = proportional;
    this.autoComplete = autoComplete;
  }

  abstract onTransformStart(
    element: Model,
    data: TransformControllerContext
  ): void;
  abstract onTransformEnd(
    element: Model,
    data: TransformControllerContext
  ): void;

  abstract adjust(element: Model, data: TransformControllerContext): void;
  // if defined then then rotate behavior is overridden
}

export type EdgelessModelConstructor<
  Model extends BlockSuite.EdgelessModelType = BlockSuite.EdgelessModelType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = { new (...args: any[]): Model };

export class EdgelessTransformableRegistry {
  private static _registry = new WeakMap<
    EdgelessModelConstructor,
    EdgelessTransformController<BlockSuite.EdgelessModelType> | null
  >();

  private constructor() {}

  static register<Model extends BlockSuite.EdgelessModelType>(
    cstr: EdgelessModelConstructor<Model>,
    controller: EdgelessTransformController<Model>
  ) {
    this._registry.set(
      cstr,
      controller as EdgelessTransformController<BlockSuite.EdgelessModelType>
    );
  }

  static get(
    model: BlockSuite.EdgelessModelType
  ): EdgelessTransformController<BlockSuite.EdgelessModelType> | null {
    const cstr = model.constructor as EdgelessModelConstructor;

    // todo(golok) allow inherit controller
    return this._registry.get(cstr) ?? null;
  }
}
