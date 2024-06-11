import type { Constructor } from '@blocksuite/global/utils';
import { BlockModel } from '@blocksuite/store';

import { EdgelessBlockModel } from '../../../root-block/edgeless/edgeless-block-model.js';
import type { SerializedXYWH } from '../../../surface-block/index.js';

export type EdgelessSelectableProps = {
  xywh: SerializedXYWH;
  index: string;
};

export function selectable<
  Props extends EdgelessSelectableProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  if (SuperClass === BlockModel) {
    return EdgelessBlockModel as unknown as typeof EdgelessBlockModel<Props>;
  } else {
    let currentClass = SuperClass;

    while (
      Object.getPrototypeOf(currentClass.prototype) !== BlockModel.prototype &&
      Object.getPrototypeOf(currentClass.prototype) !== null
    ) {
      currentClass = Object.getPrototypeOf(currentClass.prototype).constructor;
    }

    if (Object.getPrototypeOf(currentClass.prototype) === null) {
      throw new Error('The SuperClass is not a subclass of BlockModel');
    }

    Object.setPrototypeOf(currentClass.prototype, EdgelessBlockModel.prototype);
  }

  return SuperClass as unknown as typeof EdgelessBlockModel<Props>;
}
