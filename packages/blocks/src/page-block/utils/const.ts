import type { BaseBlockModel, Page } from '@blocksuite/store';
import { handleFormat } from '../../page-block/utils/index.js';
import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import {
  BoldIcon,
  BulletedListIcon,
  CodeIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  H6Icon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  NumberedIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  TodoIcon,
  UnderlineIcon,
} from './icons.js';

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
    icon: NumberedIcon,
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
    type: 'code',
    name: 'Code Block',
    hotkey: 'command+option+c,ctrl+alt+c',
    icon: CodeIcon,
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
];

type ActionProps = {
  page: Page;
  abortController?: AbortController;
  /**
   * The current format of the selected text
   */
  format?: Record<string, unknown>;
};

export const formatConfig = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'command+b,ctrl+b',
    activeWhen: (format: Record<string, unknown>) => 'bold' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: 'command+i,ctrl+i',
    activeWhen: (format: Record<string, unknown>) => 'italic' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: 'command+u,ctrl+u',
    activeWhen: (format: Record<string, unknown>) => 'underline' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: 'command+shift+s,ctrl+shift+s',
    activeWhen: (format: Record<string, unknown>) => 'strike' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: 'command+e,ctrl+e',
    activeWhen: (format: Record<string, unknown>) => 'code' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: 'command+k,ctrl+k',
    activeWhen: (format: Record<string, unknown>) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) =>
      models.length === 1 && noneCodeBlockSelected(models),
    action: ({ page, abortController, format }: ActionProps) => {
      createLink(page);
      if (format && abortController && !('link' in format)) {
        abortController.abort();
      }
    },
  },
];

function noneCodeBlockSelected(models: BaseBlockModel[]) {
  return !models.every(model => model.flavour === 'affine:code');
}
