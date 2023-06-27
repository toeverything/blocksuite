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
import { type TemplateResult } from 'lit';

import {
  type NoteChildrenFlavour,
  type NoteChildrenType,
} from '../../../../__internal__/index.js';

export const BUTTON_GROUP_LENGTH = 10;

type ButtonConfig = {
  icon: TemplateResult<1>;
  tooltip: string;
  childFlavour: NoteChildrenFlavour;
  childType: NoteChildrenType;
};

export const ButtonConfigs: ButtonConfig[] = [
  {
    icon: TextIcon,
    tooltip: 'Text Block',
    childFlavour: 'affine:paragraph',
    childType: 'text',
  },
  {
    icon: H1Icon,
    tooltip: 'Heading 1',
    childFlavour: 'affine:paragraph',
    childType: 'h1',
  },
  {
    icon: H2Icon,
    tooltip: 'Heading 2',
    childFlavour: 'affine:paragraph',
    childType: 'h2',
  },
  {
    icon: H3Icon,
    tooltip: 'Heading 3',
    childFlavour: 'affine:paragraph',
    childType: 'h3',
  },
  {
    icon: H4Icon,
    tooltip: 'Heading 4',
    childFlavour: 'affine:paragraph',
    childType: 'h4',
  },
  {
    icon: H5Icon,
    tooltip: 'Heading 5',
    childFlavour: 'affine:paragraph',
    childType: 'h5',
  },
  {
    icon: H6Icon,
    tooltip: 'Heading 6',
    childFlavour: 'affine:paragraph',
    childType: 'h6',
  },
  {
    icon: CodeBlockIcon,
    tooltip: 'Code Block',
    childFlavour: 'affine:code',
    childType: null,
  },
  {
    icon: QuoteIcon,
    tooltip: 'Quote',
    childFlavour: 'affine:paragraph',
    childType: 'quote',
  },
  {
    icon: BulletedListIcon,
    tooltip: 'Bulleted List',
    childFlavour: 'affine:list',
    childType: 'bulleted',
  },
  {
    icon: NumberedListIcon,
    tooltip: 'Numbered List',
    childFlavour: 'affine:list',
    childType: 'numbered',
  },
  {
    icon: TodoIcon,
    tooltip: 'Todo List',
    childFlavour: 'affine:list',
    childType: 'todo',
  },
  // TODO: Add these blocks later
  // {
  //   icon: ImageIcon,
  //   tooltip: 'Image',
  //   childFlavour: 'affine:image',
  //   childType: 'image',
  // },
  // {
  //   icon: BookmarkIcon,
  //   tooltip: 'Bookmark',
  //   childFlavour: 'affine:bookmark',
  //   childType: 'bookmark',
  // },
  // {
  //   icon: DatabaseTableViewIcon,
  //   tooltip: 'Database',
  //   childFlavour: 'affine:database',
  //   childType: 'database',
  // },
];
