import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

export interface SyncedBlockEdgelessProps {
  index: string;
  xywh: SerializedXYWH;
  rotate: number;
  scale?: number;
}

export type SyncedBlockProps = {
  pageId: string;
  caption?: string;
} & SyncedBlockEdgelessProps;

export const defaultSyncedProps: SyncedBlockProps = {
  pageId: '',
  caption: undefined,
  index: 'a0',
  xywh: '[0,0,0,0]',
  rotate: 0,
};

export const SyncedBlockSchema = defineBlockSchema({
  flavour: 'affine:synced',
  props: (): SyncedBlockProps => defaultSyncedProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note', 'affine:surface'],
  },
  toModel: () => new SyncedBlockModel(),
});

export class SyncedBlockModel extends selectable<SyncedBlockProps>(
  BlockModel
) {}
