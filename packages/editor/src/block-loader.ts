// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '@blocksuite/blocks';
import { ParagraphBlockModel } from '@blocksuite/blocks';
import { ListBlockModel } from '@blocksuite/blocks';
import { GroupBlockModel } from '@blocksuite/blocks';
import { DividerBlockModel } from '@blocksuite/blocks';
import { EmbedBlockModel } from '@blocksuite/blocks';
import { ShapeBlockModel } from '@blocksuite/blocks';
export type { ParagraphBlockProps as TextBlockProps } from '@blocksuite/blocks';

// TODO support dynamic register
export const BlockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:group': GroupBlockModel,
  'affine:divider': DividerBlockModel,
  'affine:embed': EmbedBlockModel,
  'affine:shape': ShapeBlockModel
} as const;
