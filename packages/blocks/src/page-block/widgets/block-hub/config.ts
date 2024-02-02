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
  flavour: string;
  type: string | null;
  name: string;
  description: string;
  icon: unknown;
  tooltip: string;
};

export const BLOCKHUB_TEXT_ITEMS: BlockHubItem[] = [
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Text',
    description: 'Start typing with plain text.',
    icon: TextIcon,
    tooltip: 'Drag/Click to insert Text block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    description: 'Headings in the largest font.',
    icon: Heading1Icon,
    tooltip: 'Drag/Click to insert Heading 1',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    description: 'Headings in the 2nd font size.',
    icon: Heading2Icon,
    tooltip: 'Drag/Click to insert Heading 2',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    description: 'Headings in the 3rd font size.',
    icon: Heading3Icon,
    tooltip: 'Drag/Click to insert Heading 3',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    description: 'Heading in the 4th font size.',
    icon: Heading4Icon,
    tooltip: 'Drag/Click to insert Heading 4',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    description: 'Heading in the 5th font size.',
    icon: Heading5Icon,
    tooltip: 'Drag/Click to insert Heading 5',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    description: 'Heading in the 6th font size.',
    icon: Heading6Icon,
    tooltip: 'Drag/Click to insert Heading 6',
  },
  {
    flavour: 'affine:code',
    type: 'code',
    name: 'Code Block',
    description: 'Capture a code snippet.',
    icon: CodeBlockIcon,
    tooltip: 'Drag/Click to insert Code Block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    description: 'Capture a quote.',
    icon: QuoteIcon,
    tooltip: 'Drag/Click to insert Quote',
  },
  {
    flavour: 'affine:divider',
    type: null,
    name: 'Divider',
    description: 'A visual divider.',
    icon: DividerIcon,
    tooltip: 'A visual divider',
  },
];

export const BLOCKHUB_LIST_ITEMS: BlockHubItem[] = [
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    description: 'A simple bulleted list.',
    icon: BulletedListIcon,
    tooltip: 'Drag/Click to insert Bulleted List',
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    description: 'A list with numbering.',
    icon: NumberedListIcon,
    tooltip: 'Drag/Click to insert Numbered List',
  },
  {
    flavour: 'affine:list',
    type: 'todo',
    name: 'To-do List',
    description: 'Track tasks with a to-do list.',
    icon: CheckBoxIcon,
    tooltip: 'Drag/Click to insert To-do List',
  },
];

export const BLOCKHUB_FILE_ITEMS: BlockHubItem[] = [
  {
    flavour: 'affine:image',
    type: 'image',
    name: 'Image',
    description: 'Upload images.',
    icon: ImageIcon,
    tooltip: 'Drag/Click to insert Image',
  },
  {
    flavour: 'affine:bookmark',
    type: 'bookmark',
    name: 'Bookmark',
    description: 'Insert a link in card view.',
    icon: BookmarkIcon,
    tooltip: 'Drag/Click to insert Bookmark',
  },
];
