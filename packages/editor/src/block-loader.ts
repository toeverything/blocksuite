// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '../../blocks/src/page-block/page-model';
import { ParagraphBlockModel } from '../../blocks/src/paragraph-block/paragraph-model';
import { ListBlockModel } from '../../blocks/src/list-block/list-model';

export type { ParagraphBlockProps as TextBlockProps } from '../../blocks';

// TODO support dynamic register
export const BlockMap = {
  paragraph: ParagraphBlockModel,
  page: PageBlockModel,
  list: ListBlockModel,
} as const;
