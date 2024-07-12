import type { Constructor } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import type { EmbedProps } from './types.js';

import {
  type EdgelessSelectableProps,
  selectable,
} from '../edgeless/mixin/index.js';

export function defineEmbedModel<
  Props extends object,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  return selectable<Props & EdgelessSelectableProps>(
    SuperClass as Constructor<BlockModel<Props & EdgelessSelectableProps>>
  );
}

export type EmbedBlockModel<Props = object> = BlockModel<EmbedProps<Props>>;
