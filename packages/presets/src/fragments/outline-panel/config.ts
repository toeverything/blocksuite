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

const paragraphIconMap: {
  [key in ParagraphBlockModel['type']]: TemplateResult<1>;
} = {
  h1: SmallHeading1Icon,
  h2: SmallHeading2Icon,
  h3: SmallHeading3Icon,
  h4: SmallHeading4Icon,
  h5: SmallHeading5Icon,
  h6: SmallHeading6Icon,
  quote: SmallQuoteBlockIcon,
  text: SmallTextIcon,
};

export const previewIconMap = {
  ...paragraphIconMap,
  attachment: SmallAttachmentIcon,
  bookmark: SmallBookmarkIcon,
  bulleted: SmallBulletListIcon,
  code: SmallCodeBlockIcon,
  image: SmallImageIcon,
  kanban: SmallDatabaseKanbanIcon,
  numbered: SmallNumberListIcon,
  table: SmallDatabaseTableIcon,
  todo: SmallTodoIcon,
  toggle: BlockPreviewIcon,
};

const paragraphPlaceholderMap: {
  [key in ParagraphBlockModel['type']]: string;
} = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  quote: 'Quote',
  text: 'Text Block',
};

export const placeholderMap = {
  attachment: 'Attachment',
  bookmark: 'Bookmark',
  bulleted: 'Bulleted List',
  code: 'Code Block',
  database: 'Database',
  image: 'Image',
  numbered: 'Numbered List',
  todo: 'Todo',
  toggle: 'Toggle List',
  ...paragraphPlaceholderMap,
};

export const headingKeys = new Set(
  Object.keys(paragraphPlaceholderMap).filter(key => key.startsWith('h'))
);

export const outlineSettingsKey = 'outlinePanelSettings';

export type OutlineSettingsDataType = {
  enableSorting: boolean;
  showIcons: boolean;
};
