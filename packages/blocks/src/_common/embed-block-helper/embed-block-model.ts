import type { Constructor } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import {
  type EdgelessSelectableProps,
  selectable,
} from '../edgeless/mixin/index.js';
import type { EmbedProps } from './types.js';

export function makeEmbedModel<
  Props extends object,
  T extends Constructor<BaseBlockModel<Props>> = Constructor<
    BaseBlockModel<Props>
  >,
>(SuperClass: T) {
  return selectable<Props & EdgelessSelectableProps>(
    SuperClass as Constructor<BaseBlockModel<Props & EdgelessSelectableProps>>
  );
}

export type EmbedBlockModel<Props = object> = BaseBlockModel<EmbedProps<Props>>;
