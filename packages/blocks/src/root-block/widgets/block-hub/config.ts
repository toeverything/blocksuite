import {
  BookmarkIcon,
  BulletedListIcon,
  CheckBoxIcon,
  CodeBlockIcon,
  DividerIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ImageIcon,
  NumberedListIcon,
  QuoteIcon,
  TextIcon,
} from '../../../_common/icons/index.js';

export const TRANSITION_DELAY = 200;
export const BOTTOM_OFFSET = 70;
export const RIGHT_OFFSET = 24;
export const TOP_DISTANCE = 24;

export type BlockHubItem = {
  description: string;
  flavour: string;
  icon: unknown;
  name: string;
  tooltip: string;
  type: null | string;
};

export const BLOCKHUB_TEXT_ITEMS: BlockHubItem[] = [
  {
    description: 'Start typing with plain text.',
    flavour: 'affine:paragraph',
    icon: TextIcon,
    name: 'Text',
    tooltip: 'Drag/Click to insert Text block',
    type: 'text',
  },
  {
    description: 'Headings in the largest font.',
    flavour: 'affine:paragraph',
    icon: Heading1Icon,
    name: 'Heading 1',
    tooltip: 'Drag/Click to insert Heading 1',
    type: 'h1',
  },
  {
    description: 'Headings in the 2nd font size.',
    flavour: 'affine:paragraph',
    icon: Heading2Icon,
    name: 'Heading 2',
    tooltip: 'Drag/Click to insert Heading 2',
    type: 'h2',
  },
  {
    description: 'Headings in the 3rd font size.',
    flavour: 'affine:paragraph',
    icon: Heading3Icon,
    name: 'Heading 3',
    tooltip: 'Drag/Click to insert Heading 3',
    type: 'h3',
  },
  {
    description: 'Heading in the 4th font size.',
    flavour: 'affine:paragraph',
    icon: Heading4Icon,
    name: 'Heading 4',
    tooltip: 'Drag/Click to insert Heading 4',
    type: 'h4',
  },
  {
    description: 'Heading in the 5th font size.',
    flavour: 'affine:paragraph',
    icon: Heading5Icon,
    name: 'Heading 5',
    tooltip: 'Drag/Click to insert Heading 5',
    type: 'h5',
  },
  {
    description: 'Heading in the 6th font size.',
    flavour: 'affine:paragraph',
    icon: Heading6Icon,
    name: 'Heading 6',
    tooltip: 'Drag/Click to insert Heading 6',
    type: 'h6',
  },
  {
    description: 'Capture a code snippet.',
    flavour: 'affine:code',
    icon: CodeBlockIcon,
    name: 'Code Block',
    tooltip: 'Drag/Click to insert Code Block',
    type: 'code',
  },
  {
    description: 'Capture a quote.',
    flavour: 'affine:paragraph',
    icon: QuoteIcon,
    name: 'Quote',
    tooltip: 'Drag/Click to insert Quote',
    type: 'quote',
  },
  {
    description: 'A visual divider.',
    flavour: 'affine:divider',
    icon: DividerIcon,
    name: 'Divider',
    tooltip: 'A visual divider',
    type: null,
  },
];

export const BLOCKHUB_LIST_ITEMS: BlockHubItem[] = [
  {
    description: 'A simple bulleted list.',
    flavour: 'affine:list',
    icon: BulletedListIcon,
    name: 'Bulleted List',
    tooltip: 'Drag/Click to insert Bulleted List',
    type: 'bulleted',
  },
  {
    description: 'A list with numbering.',
    flavour: 'affine:list',
    icon: NumberedListIcon,
    name: 'Numbered List',
    tooltip: 'Drag/Click to insert Numbered List',
    type: 'numbered',
  },
  {
    description: 'Track tasks with a to-do list.',
    flavour: 'affine:list',
    icon: CheckBoxIcon,
    name: 'To-do List',
    tooltip: 'Drag/Click to insert To-do List',
    type: 'todo',
  },
];

export const BLOCKHUB_FILE_ITEMS: BlockHubItem[] = [
  {
    description: 'Upload images.',
    flavour: 'affine:image',
    icon: ImageIcon,
    name: 'Image',
    tooltip: 'Drag/Click to insert Image',
    type: 'image',
  },
  {
    description: 'Insert a link in card view.',
    flavour: 'affine:bookmark',
    icon: BookmarkIcon,
    name: 'Bookmark',
    tooltip: 'Drag/Click to insert Bookmark',
    type: 'bookmark',
  },
];
