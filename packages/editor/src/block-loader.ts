// Use manual per-module import/export to support vitest environment on Node.js
import {
  PageBlockModel,
  ParagraphBlockModel,
  ListBlockModel,
  GroupBlockModel,
  CodeBlockModel,
  DividerBlockModel,
  EmbedBlockModel,
  ShapeBlockModel,
} from '@blocksuite/blocks/models';

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
