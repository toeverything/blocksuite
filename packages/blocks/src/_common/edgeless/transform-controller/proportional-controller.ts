import { HandleDirection } from '../../../root-block/edgeless/components/resize/resize-handles.js';
import { Bound } from '../../../surface-block/utils/bound.js';
import {
  EdgelessTransformController,
  type TransformControllerContext,
  type TransformControllerOptions,
} from './transform-controller.js';

export class ProportionalTransformController<
  Model extends BlockSuite.EdgelessModelType,
> extends EdgelessTransformController<Model> {
  private _getHeight: (el: Model) => number | undefined;

  override proportional = true;

  constructor(
    getHeight: ProportionalTransformController<Model>['_getHeight'],
    options?: Partial<Omit<TransformControllerOptions, 'proportional'>>
  ) {
    super(options);
    this._getHeight = getHeight;
  }

  override onTransformStart() {}

  override onTransformEnd() {}

  override adjust(
    element: Model,
    { direction, bound, rect }: TransformControllerContext
  ) {
    const curBound = Bound.deserialize(element.xywh);
    const height = this._getHeight(element);

    if (height !== undefined) {
      rect.updateScaleDisplay(bound.h / height, direction);
    }

    if (
      direction === HandleDirection.Left ||
      direction === HandleDirection.Right
    ) {
      bound.h = (curBound.h / curBound.w) * bound.w;
    } else if (
      direction === HandleDirection.Top ||
      direction === HandleDirection.Bottom
    ) {
      bound.w = (curBound.w / curBound.h) * bound.h;
    }

    rect.edgeless.service.updateElement(element.id, {
      xywh: bound.serialize(),
    });
  }
}

export function getProportionalController<
  Model extends BlockSuite.EdgelessModelType,
>(
  getHeight: (el: Model) => number | undefined,
  options?: Partial<Omit<TransformControllerOptions, 'proportional'>>
) {
  return new ProportionalTransformController<Model>(getHeight, options);
}
