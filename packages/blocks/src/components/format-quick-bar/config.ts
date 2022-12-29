import type { BaseBlockModel, Page } from '@blocksuite/store';
import { handleFormat } from '../../page-block/utils/index.js';
import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import './button';
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
import { CodeBlockModel } from '../../code-block/index.js';

export const paragraphButtons = [
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Text',
    icon: TextIcon,
  },
  { flavour: 'affine:paragraph', type: 'h1', name: 'Heading 1', icon: H1Icon },
  { flavour: 'affine:paragraph', type: 'h2', name: 'Heading 2', icon: H2Icon },
  { flavour: 'affine:paragraph', type: 'h3', name: 'Heading 3', icon: H3Icon },
  { flavour: 'affine:paragraph', type: 'h4', name: 'Heading 4', icon: H4Icon },
  { flavour: 'affine:paragraph', type: 'h5', name: 'Heading 5', icon: H5Icon },
  { flavour: 'affine:paragraph', type: 'h6', name: 'Heading 6', icon: H6Icon },
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    icon: BulletedListIcon,
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    icon: NumberedIcon,
  },
  { flavour: 'affine:list', type: 'todo', name: 'To-do List', icon: TodoIcon },
  { flavour: 'affine:code', type: 'code', name: 'Code Block', icon: CodeIcon },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    icon: QuoteIcon,
  },
  // {
  //   flavour: 'affine:',
  //   type: 'callout',
  //   name: 'Callout',
  //   icon: CalloutIcon,
  // },
] as const;

type ActionProps = {
  page: Page;
  abortController: AbortController;
  format: Record<string, unknown>;
};

export const formatButtons = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
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
    activeWhen: (format: Record<string, unknown>) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) =>
      models.length === 1 && noneCodeBlockSelected(models),
    action: ({ page, abortController, format }: ActionProps) => {
      createLink(page);
      if (!('link' in format)) {
        abortController.abort();
      }
    },
  },
];

export const noneCodeBlockSelected = (models: BaseBlockModel[]) => {
  return !models.every(model => model instanceof CodeBlockModel);
};
