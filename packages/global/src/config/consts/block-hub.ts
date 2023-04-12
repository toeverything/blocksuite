import type { TemplateResult } from 'lit/html.js';

import type { BlockModelProps } from '../../types.js';
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
import { SHORT_KEY } from './short-key.js';

export type BlockConfig<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ALLProps extends Record<string, any> = BlockModelProps,
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
    hotkey: `${SHORT_KEY}+option+0,${SHORT_KEY}+shift+0`,
    icon: TextIcon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    hotkey: `${SHORT_KEY}+option+1,${SHORT_KEY}+shift+1`,
    icon: H1Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    hotkey: `${SHORT_KEY}+option+2,${SHORT_KEY}+shift+2`,
    icon: H2Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    hotkey: `${SHORT_KEY}+option+3,${SHORT_KEY}+shift+3`,
    icon: H3Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    hotkey: `${SHORT_KEY}+option+4,${SHORT_KEY}+shift+4`,
    icon: H4Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    hotkey: `${SHORT_KEY}+option+5,${SHORT_KEY}+shift+5`,
    icon: H5Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    hotkey: `${SHORT_KEY}+option+6,${SHORT_KEY}+shift+6`,
    icon: H6Icon,
  },
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    hotkey: `${SHORT_KEY}+option+8,${SHORT_KEY}+shift+8`,
    icon: BulletedListIcon,
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    hotkey: `${SHORT_KEY}+option+9,${SHORT_KEY}+shift+9`,
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
    hotkey: `${SHORT_KEY}+option+c,${SHORT_KEY}+alt+c`,
    icon: CodeBlockIcon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    hotkey: null,
    icon: QuoteIcon,
  },
  {
    flavour: 'affine:divider',
    type: 'divider',
    name: 'Divider',
    hotkey: `${SHORT_KEY}+option+d,${SHORT_KEY}+shift+d`,
    icon: DividerIcon,
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
    tooltip: 'Drag to insert Text block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    description: 'Headings in the largest font.',
    icon: H1Icon,
    tooltip: 'Drag to insert Heading 1',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    description: 'Headings in the 2nd font size.',
    icon: H2Icon,
    tooltip: 'Drag to insert Heading 2',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    description: 'Headings in the 3rd font size.',
    icon: H3Icon,
    tooltip: 'Drag to insert Heading 3',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    description: 'Heading in the 4th font size.',
    icon: H4Icon,
    tooltip: 'Drag to insert Heading 4',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    description: 'Heading in the 5th font size.',
    icon: H5Icon,
    tooltip: 'Drag to insert Heading 5',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    description: 'Heading in the 6th font size.',
    icon: H6Icon,
    tooltip: 'Drag to insert Heading 6',
  },
  {
    flavour: 'affine:code',
    type: null,
    name: 'Code Block',
    description: 'Capture a code snippet.',
    icon: CodeBlockIcon,
    tooltip: 'Drag to insert Code Block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    description: 'Capture a quote.',
    icon: QuoteIcon,
    tooltip: 'Drag to insert Quote',
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

export const BLOCKHUB_LIST_ITEMS = [
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    description: 'A simple bulleted list.',
    icon: BulletedListIcon,
    tooltip: 'Drag to insert Bulleted List',
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    description: 'A list with numbering.',
    icon: NumberedListIcon,
    tooltip: 'Drag to insert Numbered List',
  },
  {
    flavour: 'affine:list',
    type: 'todo',
    name: 'To-do List',
    description: 'Track tasks with a to-do list.',
    icon: TodoIcon,
    tooltip: 'Drag to insert To-do List',
  },
];

export const BLOCKHUB_FILE_ITEMS = [
  {
    flavour: 'affine:embed',
    type: 'image',
    name: 'Image',
    description: 'Upload images.',
    icon: ImageIcon,
    tooltip: 'Drag to insert Image',
  },
];
