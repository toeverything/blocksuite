import type { Constructor } from '@blocksuite/global/utils';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import { BlockModel } from '@blocksuite/store';

import { EdgelessBlockNode } from '../../../root-block/edgeless/edgeless-block-node.js';

export type EdgelessSelectableProps = {
  xywh: SerializedXYWH;
  index: string;
};

export function selectable<
  Props extends EdgelessSelectableProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  if (SuperClass === BlockModel) {
    return EdgelessBlockNode as unknown as typeof EdgelessBlockNode<Props>;
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

    Object.setPrototypeOf(currentClass.prototype, EdgelessBlockNode.prototype);
  }

  return SuperClass as unknown as typeof EdgelessBlockNode<Props>;
}
