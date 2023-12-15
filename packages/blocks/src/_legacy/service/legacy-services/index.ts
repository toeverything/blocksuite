import type { Flavour } from '../../../models.js';
import { BaseService } from '../service.js';
import { registerService } from '../singleton.js';
import { services } from '../singleton.js';
import { AttachmentBlockService } from './attachment-service.js';
import { BookmarkBlockService } from './bookmark-service.js';
import { CodeBlockService } from './code-service.js';
import { LegacyDatabaseBlockService } from './database-service.js';
import { DividerBlockService } from './divider-service.js';
import { FrameBlockService } from './frame-service.js';
import { ImageBlockService } from './image-service.js';
import { ListBlockService } from './list-service.js';
import { NoteBlockService } from './note-service.js';
import { PageBlockService } from './page-service.js';
import ParagraphBlockService from './paragraph-service.js';

type UnionToIntersection<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (T extends any ? (x: T) => any : never) extends (x: infer R) => any
    ? R
    : never;

export const blockService = {
  'affine:page': PageBlockService,
  'affine:code': CodeBlockService,
  'affine:database': LegacyDatabaseBlockService,
  'affine:paragraph': ParagraphBlockService,
  'affine:list': ListBlockService,
  'affine:image': ImageBlockService,
  'affine:divider': DividerBlockService,
  'affine:note': NoteBlockService,
  'affine:frame': FrameBlockService,
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
registerAllBlocks();

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
): BlockServiceInstanceByKey<Key>;
export function getServiceOrRegister(flavour: string): BaseService;
export function getServiceOrRegister(flavour: string): BaseService {
  let service = services.get(flavour);
  if (!service) {
    const Constructor =
      blockService[flavour as keyof BlockService] ?? BaseService;
    registerService(flavour, Constructor);
    service = services.get(flavour);
  }
  return service as BaseService;
}
