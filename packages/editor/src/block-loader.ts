// manual import to support vitest environment
import { PageBlockModel } from '../../blocks/src/page-block/page-model';
import { TextBlockModel } from '../../blocks/src/text-block/text-model';
import { ListBlockModel } from '../../blocks/src/list-block/list-model';
export type { TextBlockProps } from '../../blocks';

// TODO support dynamic register
export const BlockMap = {
  text: TextBlockModel,
  page: PageBlockModel,
  list: ListBlockModel,
} as const;
