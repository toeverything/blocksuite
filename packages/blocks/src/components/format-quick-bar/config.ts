import type { BaseBlockModel, Space } from '@blocksuite/store';
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
    key: 'text',
    name: 'Text',
    icon: TextIcon,
  },
  { key: 'h1', name: 'Heading 1', icon: H1Icon },
  { key: 'h2', name: 'Heading 2', icon: H2Icon },
  { key: 'h3', name: 'Heading 3', icon: H3Icon },
  { key: 'h4', name: 'Heading 4', icon: H4Icon },
  { key: 'h5', name: 'Heading 5', icon: H5Icon },
  { key: 'h6', name: 'Heading 6', icon: H6Icon },
  { key: 'bulleted', name: 'Bulleted List', icon: BulletedListIcon },
  { key: 'numbered', name: 'Numbered List', icon: NumberedIcon },
  { key: 'todo', name: 'To-do List', icon: TodoIcon },
  { key: 'code', name: 'Code Block', icon: CodeIcon },
  { key: 'quote', name: 'Quote', icon: QuoteIcon },
  { key: 'callout', name: 'Callout', icon: CalloutIcon },
] as const;

export const formatButtons = [
  {
    name: 'Bold',
    icon: BoldIcon,
    activeWhen: (models: BaseBlockModel[]) => false,
    action: (space: Space) => {
      handleFormat(space, 'bold');
    },
  },
  {
    name: 'Italic',
    icon: ItalicIcon,
    action: (space: Space) => {
      handleFormat(space, 'italic');
    },
  },
  {
    name: 'Underline',
    icon: UnderlineIcon,
    action: (space: Space) => {
      handleFormat(space, 'underline');
    },
  },
  {
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    action: (space: Space) => {
      handleFormat(space, 'strike');
    },
  },
  {
    name: 'Code',
    icon: InlineCodeIcon,
    action: (space: Space) => {
      handleFormat(space, 'code');
    },
  },
  {
    name: 'Link',
    icon: LinkIcon,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) => models.length === 1,
    action: (space: Space, abortController: AbortController) => {
      createLink(space);
      abortController.abort();
    },
  },
];
