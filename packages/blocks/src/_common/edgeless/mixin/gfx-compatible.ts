import type { Constructor } from '@blocksuite/global/utils';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import { BlockModel } from '@blocksuite/store';

import { GfxBlockModel } from '../../../root-block/edgeless/block-model.js';

export type GfxCompatibleProps = {
  xywh: SerializedXYWH;
  index: string;
};

export function GfxCompatible<
  Props extends GfxCompatibleProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(BlockModelSuperClass: T) {
  if (BlockModelSuperClass === BlockModel) {
    return GfxBlockModel as unknown as typeof GfxBlockModel<Props>;
  } else {
    let currentClass = BlockModelSuperClass;

    while (
      Object.getPrototypeOf(currentClass.prototype) !== BlockModel.prototype &&
      Object.getPrototypeOf(currentClass.prototype) !== null
    ) {
      currentClass = Object.getPrototypeOf(currentClass.prototype).constructor;
    }

    if (Object.getPrototypeOf(currentClass.prototype) === null) {
      throw new Error('The SuperClass is not a subclass of BlockModel');
    }

    Object.setPrototypeOf(currentClass.prototype, GfxBlockModel.prototype);
  }

  return BlockModelSuperClass as unknown as typeof GfxBlockModel<Props>;
}
