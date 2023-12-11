import { BaseBlockModel } from '@blocksuite/store';

import { BlockEdgelessMixin } from '../../surface-block/elements/selectable.js';
import type { EmbedProps } from './types.js';

const EmbedBlockModelEdgeless = BlockEdgelessMixin(
  class<Props = object> extends BaseBlockModel<EmbedProps<Props>> {}
);

export class EmbedBlockModel<
  Props = object,
> extends EmbedBlockModelEdgeless<Props> {}
