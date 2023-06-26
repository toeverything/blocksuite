import {
  BookmarkIcon,
  BulletedListIcon,
  CodeBlockIcon,
  DatabaseTableViewIcon,
  DividerIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  H6Icon,
  ImageIcon,
  NumberedListIcon,
  QuoteIcon,
  TextIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import type { TemplateResult } from 'lit';

export const BUTTON_GROUP_LENGTH = 10;

export type NoteChildrenFlavour =
  | 'affine:code'
  | 'affine:paragraph'
  | 'affine:list'
  | 'affine:divider'
  | 'affine:image'
  | 'affine:database'
  | 'affine:bookmark';

type ButtonConfig = {
  icon: TemplateResult<1>;
  tooltip: string;
  flavour: NoteChildrenFlavour;
  blockType: string;
};

export const ButtonConfigs: ButtonConfig[] = [
  {
    icon: TextIcon,
    tooltip: 'Text Block',
    flavour: 'affine:paragraph',
    blockType: 'text',
  },
  {
    icon: H1Icon,
    tooltip: 'Heading 1',
    flavour: 'affine:paragraph',
    blockType: 'heading1',
  },
  {
    icon: H2Icon,
    tooltip: 'Heading 2',
    flavour: 'affine:paragraph',
    blockType: 'heading2',
  },
  {
    icon: H3Icon,
    tooltip: 'Heading 3',
    flavour: 'affine:paragraph',
    blockType: 'heading3',
  },
  {
    icon: H4Icon,
    tooltip: 'Heading 4',
    flavour: 'affine:paragraph',
    blockType: 'heading4',
  },
  {
    icon: H5Icon,
    tooltip: 'Heading 5',
    flavour: 'affine:paragraph',
    blockType: 'heading5',
  },
  {
    icon: H6Icon,
    tooltip: 'Heading 6',
    flavour: 'affine:paragraph',
    blockType: 'heading6',
  },
  {
    icon: CodeBlockIcon,
    tooltip: 'Code Block',
    flavour: 'affine:code',
    blockType: 'code',
  },
  {
    icon: QuoteIcon,
    tooltip: 'Quote Block',
    flavour: 'affine:paragraph',
    blockType: 'quote',
  },
  {
    icon: DividerIcon,
    tooltip: 'Divider',
    flavour: 'affine:divider',
    blockType: 'divider',
  },
  {
    icon: BulletedListIcon,
    tooltip: 'Bulleted List',
    flavour: 'affine:list',
    blockType: 'bulleted',
  },
  {
    icon: NumberedListIcon,
    tooltip: 'Numbered List',
    flavour: 'affine:list',
    blockType: 'numbered',
  },
  {
    icon: TodoIcon,
    tooltip: 'Todo List',
    flavour: 'affine:list',
    blockType: 'todo',
  },
  {
    icon: ImageIcon,
    tooltip: 'Image',
    flavour: 'affine:image',
    blockType: 'image',
  },
  {
    icon: BookmarkIcon,
    tooltip: 'Bookmark',
    flavour: 'affine:bookmark',
    blockType: 'bookmark',
  },
  {
    icon: DatabaseTableViewIcon,
    tooltip: 'Database',
    flavour: 'affine:database',
    blockType: 'database',
  },
];
