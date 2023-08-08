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
  SHORT_KEY,
  TextIcon,
  TodoIcon,
} from '@blocksuite/global/config';
import type { TemplateResult } from 'lit';

import type { BlockSchemas } from '../../models.js';

interface BlockConfig {
  flavour: keyof BlockSchemas;
  type?: string;
  name: string;
  hotkey: string | null;
  icon: TemplateResult<1>;
}

export const paragraphConfig: BlockConfig[] = [
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
    // Use `alt` instead of `shift` because `ctrl+shift+c` will open chrome devtools on Windows.
    // Use `command` / `ctrl` instead of `${SHORT_KEY}` because `option` and `alt` are the same key on Mac, they will trigger twice.
    hotkey: `command+option+c,ctrl+alt+c`,
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
];
