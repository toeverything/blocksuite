import {
  BoldIcon,
  InlineCodeIcon,
  InlineKeyboardIcon,
  ItalicIcon,
  LinkIcon,
  SHORT_KEY,
  StrikethroughIcon,
  UnderlineIcon,
} from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';

import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import type { ActionProps } from './const.js';
import {
  getCurrentCombinedFormat,
  handleFormat,
} from './container-operations.js';

export const formatConfig = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: `${SHORT_KEY}+b`,
    activeWhen: (format: AffineTextAttributes) => 'bold' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: `${SHORT_KEY}+i`,
    activeWhen: (format: AffineTextAttributes) => 'italic' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: `${SHORT_KEY}+u`,
    activeWhen: (format: AffineTextAttributes) => 'underline' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: `${SHORT_KEY}+shift+s`,
    activeWhen: (format: AffineTextAttributes) => 'strike' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: `${SHORT_KEY}+e`,
    activeWhen: (format: AffineTextAttributes) => 'code' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'code');
    },
  },
  {
    id: 'kbd',
    name: 'Keyboard',
    icon: InlineKeyboardIcon,
    hotkey: `${SHORT_KEY}+k`,
    activeWhen: (format: AffineTextAttributes) => 'kbd' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'kbd');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: `${SHORT_KEY}+k`,
    activeWhen: (format: AffineTextAttributes) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) =>
      models.length === 1 &&
      noneCodeBlockSelected(models) &&
      // can't create link when selection includes reference node
      // XXX get loose format at here is not a good practice
      !getCurrentCombinedFormat(models[0].page, true).reference,
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
