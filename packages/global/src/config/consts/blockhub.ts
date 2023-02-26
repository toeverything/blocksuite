import type { TemplateResult } from 'lit/html.js';

import {
  BulletedListIcon,
  CodeBlockIcon,
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
} from '../icons.js';

export type BlockConfig<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ALLProps extends Record<string, any> = BlockSuiteModelProps.ALL,
  Flavour extends keyof ALLProps & string = keyof ALLProps & string
> = {
  flavour: Flavour;
  type: ALLProps[Flavour]['type'];
  name: string;
  hotkey: string | null;
  icon: TemplateResult<1>;
};

export const paragraphConfig = [
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Text',
    hotkey: 'command+option+0,ctrl+shift+0',
    icon: TextIcon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    hotkey: 'command+option+1,ctrl+shift+1',
    icon: H1Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    hotkey: 'command+option+2,ctrl+shift+2',
    icon: H2Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    hotkey: 'command+option+3,ctrl+shift+3',
    icon: H3Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    hotkey: 'command+option+4,ctrl+shift+4',
    icon: H4Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    hotkey: 'command+option+5,ctrl+shift+5',
    icon: H5Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    hotkey: 'command+option+6,ctrl+shift+6',
    icon: H6Icon,
  },
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    hotkey: 'command+option+8,ctrl+shift+8',
    icon: BulletedListIcon,
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    hotkey: 'command+option+9,ctrl+shift+9',
    icon: NumberedListIcon,
  },
  {
    flavour: 'affine:list',
    type: 'todo',
    name: 'To-do List',
    hotkey: null,
    icon: TodoIcon,
  },
  {
    flavour: 'affine:code',
    type: undefined,
    name: 'Code Block',
    hotkey: 'command+option+c,ctrl+alt+c',
    icon: CodeBlockIcon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    hotkey: null,
    icon: QuoteIcon,
  },
  // {
  //   flavour: 'affine:',
  //   type: 'callout',
  //   name: 'Callout',
  //   icon: CalloutIcon,
  // },
] satisfies BlockConfig[];

export const BLOCKHUB_TEXT_ITEMS = [
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Text',
    description: 'Start typing with plain text.',
    icon: TextIcon,
    toolTip: 'Drag to insert Text block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    description: 'Headings in the largest font.',
    icon: H1Icon,
    toolTip: 'Drag to insert Heading 1',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    description: 'Headings in the 2nd font size.',
    icon: H2Icon,
    toolTip: 'Drag to insert Heading 2',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    description: 'Headings in the 3rd font size.',
    icon: H3Icon,
    toolTip: 'Drag to insert Heading 3',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    description: 'Heading in the 4th font size.',
    icon: H4Icon,
    toolTip: 'Drag to insert Heading 4',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    description: 'Heading in the 5th font size.',
    icon: H5Icon,
    toolTip: 'Drag to insert Heading 5',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    description: 'Heading in the 6th font size.',
    icon: H6Icon,
    toolTip: 'Drag to insert Heading 6',
  },
  {
    flavour: 'affine:code',
    type: null,
    name: 'Code Block',
    description: 'Capture a code snippet.',
    icon: CodeBlockIcon,
    toolTip: 'Drag to insert Code Block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    description: 'Capture a quote.',
    icon: QuoteIcon,
    toolTip: 'Drag to insert Quote',
  },
  {
    flavour: 'affine:divider',
    type: null,
    name: 'Divider',
    description: 'A visual divider.',
    icon: DividerIcon,
    toolTip: 'A visual divider',
  },
];

export const BLOCKHUB_LIST_ITEMS = [
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    description: 'A simple bulleted list.',
    icon: BulletedListIcon,
    toolTip: 'Drag to insert Bulleted List',
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    description: 'A list with numbering.',
    icon: NumberedListIcon,
    toolTip: 'Drag to insert Numbered List',
  },
  {
    flavour: 'affine:list',
    type: 'todo',
    name: 'To-do List',
    description: 'Track tasks with a to-do list.',
    icon: TodoIcon,
    toolTip: 'Drag to insert To-do List',
  },
];

export const BLOCKHUB_FILE_ITEMS = [
  {
    flavour: 'affine:embed',
    type: 'image',
    name: 'Image',
    description: 'Upload images.',
    icon: ImageIcon,
    toolTip: 'Drag to insert Image',
  },
];
