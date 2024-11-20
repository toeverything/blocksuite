import type { ParagraphBlockModel } from '@blocksuite/blocks';
import type { TemplateResult } from 'lit';

import {
  BlockPreviewIcon,
  SmallAttachmentIcon,
  SmallBookmarkIcon,
  SmallBulletListIcon,
  SmallCodeBlockIcon,
  SmallDatabaseKanbanIcon,
  SmallDatabaseTableIcon,
  SmallHeading1Icon,
  SmallHeading2Icon,
  SmallHeading3Icon,
  SmallHeading4Icon,
  SmallHeading5Icon,
  SmallHeading6Icon,
  SmallImageIcon,
  SmallNumberListIcon,
  SmallQuoteBlockIcon,
  SmallTextIcon,
  SmallTodoIcon,
} from '../_common/icons.js';

const paragraphIconMap: Record<
  ParagraphBlockModel['type'],
  TemplateResult<1>
> = {
  quote: SmallQuoteBlockIcon,
  text: SmallTextIcon,
  h1: SmallHeading1Icon,
  h2: SmallHeading2Icon,
  h3: SmallHeading3Icon,
  h4: SmallHeading4Icon,
  h5: SmallHeading5Icon,
  h6: SmallHeading6Icon,
};

export const previewIconMap = {
  ...paragraphIconMap,
  code: SmallCodeBlockIcon,
  numbered: SmallNumberListIcon,
  bulleted: SmallBulletListIcon,
  todo: SmallTodoIcon,
  toggle: BlockPreviewIcon,
  bookmark: SmallBookmarkIcon,
  image: SmallImageIcon,
  table: SmallDatabaseTableIcon,
  kanban: SmallDatabaseKanbanIcon,
  attachment: SmallAttachmentIcon,
};

const paragraphPlaceholderMap: Record<ParagraphBlockModel['type'], string> = {
  quote: 'Quote',
  text: 'Text Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
};

export const placeholderMap = {
  code: 'Code Block',
  bulleted: 'Bulleted List',
  numbered: 'Numbered List',
  toggle: 'Toggle List',
  todo: 'Todo',
  bookmark: 'Bookmark',
  image: 'Image',
  database: 'Database',
  attachment: 'Attachment',
  ...paragraphPlaceholderMap,
};

export const headingKeys = new Set(
  Object.keys(paragraphPlaceholderMap).filter(key => key.startsWith('h'))
);

export const outlineSettingsKey = 'outlinePanelSettings';

export type OutlineSettingsDataType = {
  showIcons: boolean;
  enableSorting: boolean;
};
