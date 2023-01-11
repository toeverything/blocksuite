// Import models only, the bundled file should not include anything else.
import { CodeBlockModel } from './code-block/code-model.js';
import { DividerBlockModel } from './divider-block/divider-model.js';
import { EmbedBlockModel } from './embed-block/embed-model.js';
import { FrameBlockModel } from './frame-block/frame-model.js';
import { ListBlockModel } from './list-block/list-model.js';
import { PageBlockModel } from './page-block/page-model.js';
import { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ShapeBlockModel } from './shape-block/shape-model.js';
import { ParagraphBlockService } from './paragraph-block/paragraph-service.js';
import { SurfaceBlockModel } from './surface-block/surface-model.js';
import { ListBlockService } from './list-block/list-service.js';
import { PageBlockService } from './page-block/page-service.js';
import { DividerBlockService } from './divider-block/divider-service.js';
import type {
  AsyncServiceProtocol,
  SyncServiceProtocol,
} from './__internal__/index.js';
import type { BaseService } from './__internal__/service.js';

export {
  CodeBlockModel,
  DividerBlockModel,
  EmbedBlockModel,
  FrameBlockModel,
  ListBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  ShapeBlockModel,
};

// TODO support dynamic register
export const BlockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:frame': FrameBlockModel,
  'affine:code': CodeBlockModel,
  'affine:divider': DividerBlockModel,
  'affine:embed': EmbedBlockModel,
  // 'affine:shape': ShapeBlockModel,
  'affine:surface': SurfaceBlockModel,
};

export type BlockSchemaType = typeof BlockSchema;

export type Flavour = keyof BlockSchemaType;

export const blockService = {
  'affine:code': async () => import('./code-block/code-service.js'),
  'affine:paragraph': ParagraphBlockService,
  'affine:list': ListBlockService,
  'affine:page': PageBlockService,
  'affine:divider': DividerBlockService,
} satisfies {
  [Key in Flavour]?:
    | { new (): SyncServiceProtocol }
    | (() => Promise<{
        default: { new (): AsyncServiceProtocol };
      }>);
};

export type BlockService = typeof blockService;

export type ServiceFlavour = keyof BlockService;

export type BlockServiceInstance = {
  [Key in Flavour]: Key extends ServiceFlavour
    ? BlockService[Key] extends () => infer ServicePromise
      ? Awaited<ServicePromise> extends {
          default: { new (): unknown };
        }
        ? InstanceType<Awaited<ServicePromise>['default']>
        : never
      : BlockService[Key] extends { new (): unknown }
      ? InstanceType<BlockService[Key]>
      : never
    : InstanceType<typeof BaseService>;
};
