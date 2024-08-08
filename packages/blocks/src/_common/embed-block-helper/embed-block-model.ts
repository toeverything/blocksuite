import type { Constructor } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import {
  GfxCompatible,
  type GfxCompatibleProps,
} from '@blocksuite/affine-model';

import type { EmbedProps } from './types.js';

export function defineEmbedModel<
  Props extends object,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(BlockModelSuperClass: T) {
  return GfxCompatible<Props & GfxCompatibleProps>(
    BlockModelSuperClass as Constructor<BlockModel<Props & GfxCompatibleProps>>
  );
}

export type EmbedBlockModel<Props = object> = BlockModel<EmbedProps<Props>>;
