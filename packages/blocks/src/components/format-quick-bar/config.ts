import type { BaseBlockModel, Page } from '@blocksuite/store';
import { handleFormat } from '../../page-block/utils';
import { createLink } from '../../__internal__/rich-text/link-node';
import './button';
import {
  BoldIcon,
  BulletedListIcon,
  CalloutIcon,
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
} from './icons';

export const paragraphButtons = [
  {
    id: 'text',
    name: 'Text',
    icon: TextIcon,
  },
  { id: 'h1', name: 'Heading 1', icon: H1Icon },
  { id: 'h2', name: 'Heading 2', icon: H2Icon },
  { id: 'h3', name: 'Heading 3', icon: H3Icon },
  { id: 'h4', name: 'Heading 4', icon: H4Icon },
  { id: 'h5', name: 'Heading 5', icon: H5Icon },
  { id: 'h6', name: 'Heading 6', icon: H6Icon },
  { id: 'bulleted', name: 'Bulleted List', icon: BulletedListIcon },
  { id: 'numbered', name: 'Numbered List', icon: NumberedIcon },
  { id: 'todo', name: 'To-do List', icon: TodoIcon },
  { id: 'code', name: 'Code Block', icon: CodeIcon },
  { id: 'quote', name: 'Quote', icon: QuoteIcon },
  { id: 'callout', name: 'Callout', icon: CalloutIcon },
] as const;

export const formatButtons = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    activeWhen: (format: Record<string, unknown>) => 'bold' in format,
    action: (page: Page) => {
      handleFormat(page, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    activeWhen: (format: Record<string, unknown>) => 'italic' in format,
    action: (page: Page) => {
      handleFormat(page, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    activeWhen: (format: Record<string, unknown>) => 'underline' in format,
    action: (page: Page) => {
      handleFormat(page, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    activeWhen: (format: Record<string, unknown>) => 'strike' in format,
    action: (page: Page) => {
      handleFormat(page, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    activeWhen: (format: Record<string, unknown>) => 'code' in format,
    action: (page: Page) => {
      handleFormat(page, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    activeWhen: (format: Record<string, unknown>) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) => models.length === 1,
    action: (page: Page, abortController: AbortController) => {
      createLink(page);
      abortController.abort();
    },
  },
];
