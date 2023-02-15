import {
  BoldIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '@blocksuite/global/config';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import { getFormat, handleFormat } from '../../page-block/utils/index.js';

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
    activeWhen: () => 'bold' in getFormat(),
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
    activeWhen: () => 'italic' in getFormat(),
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
    activeWhen: () => 'underline' in getFormat(),
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
    activeWhen: () => 'strike' in getFormat(),
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
    activeWhen: () => 'code' in getFormat(),
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
    activeWhen: () => 'link' in getFormat(),
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
