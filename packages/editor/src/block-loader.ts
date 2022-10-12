// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '@blocksuite/blocks';
import { ParagraphBlockModel } from '@blocksuite/blocks';
import { ListBlockModel } from '@blocksuite/blocks';
import { GroupBlockModel } from '@blocksuite/blocks';

export type { ParagraphBlockProps as TextBlockProps } from '@blocksuite/blocks';

// TODO support dynamic register
export const BlockSchema = {
  paragraph: ParagraphBlockModel,
  page: PageBlockModel,
  list: ListBlockModel,
  group: GroupBlockModel,
} as const;
