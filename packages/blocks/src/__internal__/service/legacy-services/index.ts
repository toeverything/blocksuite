import type { UnionToIntersection } from '@blocksuite/global/utils';

import type { Flavour } from '../../../models.js';
import { BaseService } from '../service.js';
import { registerService } from '../singleton.js';
import { services } from '../singleton.js';
import { AttachmentBlockService } from './attachment-service.js';
import { BookmarkBlockService } from './bookmark-service.js';
import { CodeBlockService } from './code-service.js';
import { LegacyDatabaseBlockService } from './database-service.js';
import { DividerBlockService } from './divider-service.js';
import { ImageBlockService } from './image-service.js';
import { ListBlockService } from './list-service.js';
import { NoteBlockService } from './note-service.js';
import { PageBlockService } from './page-service.js';
import ParagraphBlockService from './paragraph-service.js';

export const blockService = {
  'affine:page': PageBlockService,
  'affine:code': CodeBlockService,
  'affine:database': LegacyDatabaseBlockService,
  'affine:paragraph': ParagraphBlockService,
  'affine:list': ListBlockService,
  'affine:image': ImageBlockService,
  'affine:divider': DividerBlockService,
  'affine:note': NoteBlockService,
  'affine:bookmark': BookmarkBlockService,
  'affine:attachment': AttachmentBlockService,
} satisfies {
  [key in Flavour]?: { new (): BaseService };
};

export function registerAllBlocks() {
  Object.entries(blockService).forEach(([flavour, Constructor]) => {
    registerService(flavour, Constructor);
  });
}

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

export function getServiceOrRegister<Key extends Flavour>(
  flavour: Key
): BlockServiceInstanceByKey<Key> | Promise<BlockServiceInstanceByKey<Key>>;
export function getServiceOrRegister(
  flavour: string
): BaseService | Promise<BaseService>;
export function getServiceOrRegister(
  flavour: string
): BaseService | Promise<BaseService> {
  const service = services.get(flavour);
  if (!service) {
    const Constructor =
      blockService[flavour as keyof BlockService] ?? BaseService;
    const result = registerService(flavour, Constructor);
    if (result instanceof Promise) {
      return result.then(() => services.get(flavour) as BaseService);
    } else {
      return services.get(flavour) as BaseService;
    }
  }
  return service as BaseService;
}
