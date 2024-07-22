import type { Constructor } from '@blocksuite/global/utils';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import { BlockModel } from '@blocksuite/store';

import { BlockNode } from '../../../root-block/edgeless/edgeless-block-node.js';

export type SelectableNodeProps = {
  xywh: SerializedXYWH;
  index: string;
};

export function selectable<
  Props extends SelectableNodeProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  if (SuperClass === BlockModel) {
    return BlockNode as unknown as typeof BlockNode<Props>;
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

    Object.setPrototypeOf(currentClass.prototype, BlockNode.prototype);
  }

  return SuperClass as unknown as typeof BlockNode<Props>;
}
