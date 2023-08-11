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
  NumberedListIcon,
  QuoteIcon,
  TextIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import type { TemplateResult } from 'lit';

import type { BlockSchemas } from '../../models.js';

interface BlockConfig {
  flavour: keyof BlockSchemas;
  type?: string;
  name: string;
  hotkey: string[] | null;
  icon: TemplateResult<1>;
}

export const paragraphConfig: BlockConfig[] = [
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Text',
    hotkey: [`Mod-Alt-0`, `Mod-Shift-0`],
    icon: TextIcon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    hotkey: [`Mod-Alt-1`, `Mod-Shift-1`],
    icon: H1Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    hotkey: [`Mod-Alt-2`, `Mod-Shift-2`],
    icon: H2Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    hotkey: [`Mod-Alt-3`, `Mod-Shift-3`],
    icon: H3Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    hotkey: [`Mod-Alt-4`, `Mod-Shift-4`],
    icon: H4Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    hotkey: [`Mod-Alt-5`, `Mod-Shift-5`],
    icon: H5Icon,
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    hotkey: [`Mod-Alt-6`, `Mod-Shift-6`],
    icon: H6Icon,
  },
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    hotkey: [`Mod-Alt-8`, `Mod-Shift-8`],
    icon: BulletedListIcon,
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    hotkey: [`Mod-Alt-9`, `Mod-Shift-9`],
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
    hotkey: [`Mod-Alt-c`],
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
    hotkey: [`Mod-Alt-d`, `Mod-Shift-d`],
    icon: DividerIcon,
  },
];
