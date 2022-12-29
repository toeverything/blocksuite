// Import models only, the bundled file should not include anything else.
import { CodeBlockModel } from './code-block/code-model.js';
import { DividerBlockModel } from './divider-block/divider-model.js';
import { EmbedBlockModel } from './embed-block/embed-model.js';
import { GroupBlockModel } from './group-block/group-model.js';
import { ListBlockModel } from './list-block/list-model.js';
import { PageBlockModel } from './page-block/page-model.js';
import { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ShapeBlockModel } from './shape-block/shape-model.js';
import { ParagraphBlockService } from './paragraph-block/paragraph-service.js';

export {
  CodeBlockModel,
  DividerBlockModel,
  EmbedBlockModel,
  GroupBlockModel,
  ListBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  ShapeBlockModel,
};

// TODO support dynamic register
export const blockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:group': GroupBlockModel,
  'affine:code': CodeBlockModel,
  'affine:divider': DividerBlockModel,
  'affine:embed': EmbedBlockModel,
  'affine:shape': ShapeBlockModel,
};

export type BlockSchema = typeof blockSchema;

export type Flavour = keyof BlockSchema;

export const blockService = {
  'affine:code': async () => import('./code-block/code-service.js'),
  'affine:paragraph': ParagraphBlockService,
};

export type BlockService = typeof blockService;

export type ServiceFlavour = keyof BlockService;

export type BlockServiceInstance = {
  [Key in keyof BlockService]: BlockService[Key] extends () => infer ServicePromise
    ? Awaited<ServicePromise> extends {
        default: { new (): unknown };
      }
      ? InstanceType<Awaited<ServicePromise>['default']>
      : never
    : BlockService[Key] extends { new (): unknown }
    ? InstanceType<BlockService[Key]>
    : never;
};
