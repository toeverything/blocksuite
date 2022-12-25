// Import models only, the bundled file should not include anything else.
import { CodeBlockModel } from './code-block/code-model.js';
import { DividerBlockModel } from './divider-block/divider-model.js';
import { EmbedBlockModel } from './embed-block/embed-model.js';
import { GroupBlockModel } from './group-block/group-model.js';
import { ListBlockModel } from './list-block/list-model.js';
import { PageBlockModel } from './page-block/page-model.js';
import { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ShapeBlockModel } from './shape-block/shape-model.js';
import { BaseBlockModel } from '@blocksuite/store';

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
export const BlockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:group': GroupBlockModel,
  'affine:code': CodeBlockModel,
  'affine:divider': DividerBlockModel,
  'affine:embed': EmbedBlockModel,
  'affine:shape': ShapeBlockModel,
} as const;

export default BlockSchema as Record<string, typeof BaseBlockModel>;
