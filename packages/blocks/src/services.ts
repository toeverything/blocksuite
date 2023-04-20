import type { UnionToIntersection } from '@blocksuite/global/types';

import type { BaseService } from './__internal__/service/index.js';
import { CodeBlockService } from './code-block/index.js';
import { DatabaseBlockService } from './database-block/database-service.js';
import { DividerBlockService } from './divider-block/index.js';
import { EmbedBlockService } from './embed-block/index.js';
import { FrameBlockService } from './frame-block/index.js';
import { ListBlockService } from './list-block/index.js';
import type { Flavour } from './models.js';
import { ParagraphBlockService } from './paragraph-block/index.js';

export const blockService = {
  'affine:code': CodeBlockService,
  'affine:database': DatabaseBlockService,
  'affine:paragraph': ParagraphBlockService,
  'affine:list': ListBlockService,
  'affine:embed': EmbedBlockService,
  'affine:divider': DividerBlockService,
  'affine:frame': FrameBlockService,
} satisfies {
  [key in Flavour]?: { new (): BaseService };
};

export type BlockService = typeof blockService;
export type ServiceFlavour = keyof BlockService;

export type BlockServiceInstance = {
  [Key in Flavour]: Key extends ServiceFlavour
    ? BlockService[Key] extends { new (): unknown }
      ? InstanceType<BlockService[Key]>
      : never
    : InstanceType<typeof BaseService>;
};

export type BlockServiceInstanceByKey<Key extends Flavour> =
  UnionToIntersection<BlockServiceInstance[Key]>;
