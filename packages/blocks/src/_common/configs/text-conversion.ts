import type { TemplateResult } from 'lit';

import {
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
  NumberedListIcon,
  QuoteIcon,
  TextIcon,
} from '../icons/index.js';

/**
 * Text primitive entries used in slash menu and format bar,
 * which are also used for registering hotkeys for converting block flavours.
 */
export interface TextConversionConfig {
  description?: string;
  flavour: BlockSuite.Flavour;
  hotkey: null | string[];
  icon: TemplateResult<1>;
  name: string;
  type?: string;
}

export const textConversionConfigs: TextConversionConfig[] = [
  {
    description: 'Start typing with plain text.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-0`, `Mod-Shift-0`],
    icon: TextIcon,
    name: 'Text',
    type: 'text',
  },
  {
    description: 'Headings in the largest font.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-1`, `Mod-Shift-1`],
    icon: Heading1Icon,
    name: 'Heading 1',
    type: 'h1',
  },
  {
    description: 'Headings in the 2nd font size.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-2`, `Mod-Shift-2`],
    icon: Heading2Icon,
    name: 'Heading 2',
    type: 'h2',
  },
  {
    description: 'Headings in the 3rd font size.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-3`, `Mod-Shift-3`],
    icon: Heading3Icon,
    name: 'Heading 3',
    type: 'h3',
  },
  {
    description: 'Headings in the 4th font size.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-4`, `Mod-Shift-4`],
    icon: Heading4Icon,
    name: 'Heading 4',
    type: 'h4',
  },
  {
    description: 'Headings in the 5th font size.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-5`, `Mod-Shift-5`],
    icon: Heading5Icon,
    name: 'Heading 5',
    type: 'h5',
  },
  {
    description: 'Headings in the 6th font size.',
    flavour: 'affine:paragraph',
    hotkey: [`Mod-Alt-6`, `Mod-Shift-6`],
    icon: Heading6Icon,
    name: 'Heading 6',
    type: 'h6',
  },
  {
    description: 'Create a bulleted list.',
    flavour: 'affine:list',
    hotkey: [`Mod-Alt-8`, `Mod-Shift-8`],
    icon: BulletedListIcon,
    name: 'Bulleted List',
    type: 'bulleted',
  },
  {
    description: 'Create a numbered list.',
    flavour: 'affine:list',
    hotkey: [`Mod-Alt-9`, `Mod-Shift-9`],
    icon: NumberedListIcon,
    name: 'Numbered List',
    type: 'numbered',
  },
  {
    description: 'Add tasks to a to-do list.',
    flavour: 'affine:list',
    hotkey: null,
    icon: CheckBoxIcon,
    name: 'To-do List',
    type: 'todo',
  },
  {
    description: 'Code snippet with formatting.',
    flavour: 'affine:code',
    hotkey: [`Mod-Alt-c`],
    icon: CodeBlockIcon,
    name: 'Code Block',
    type: undefined,
  },
  {
    description: 'Add a blockquote for emphasis.',
    flavour: 'affine:paragraph',
    hotkey: null,
    icon: QuoteIcon,
    name: 'Quote',
    type: 'quote',
  },
  {
    description: 'Insert a line to separate sections.',
    flavour: 'affine:divider',
    hotkey: [`Mod-Alt-d`, `Mod-Shift-d`],
    icon: DividerIcon,
    name: 'Divider',
    type: 'divider',
  },
];
