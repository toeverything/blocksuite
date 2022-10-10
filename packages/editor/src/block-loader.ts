// Use manual per-module import/export to support vitest environment on Node.js
import { PageBlockModel } from '../../blocks/src/page-block/page-model';
import { ParagraphBlockModel } from '../../blocks/src/paragraph-block/paragraph-model';
import { ListBlockModel } from '../../blocks/src/list-block/list-model';
import { GroupBlockModel } from '../../blocks/src/group-block/group-model';

export type { ParagraphBlockProps as TextBlockProps } from '../../blocks';

// TODO support dynamic register
export const BlockSchema = {
  paragraph: ParagraphBlockModel,
  page: PageBlockModel,
  list: ListBlockModel,
  group: GroupBlockModel,
} as const;
