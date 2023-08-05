import {
  BoldIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  SHORT_KEY,
  StrikethroughIcon,
  UnderlineIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import type { PageBlockComponent } from '../types.js';
import {
  getCurrentCombinedFormat,
  handleFormat,
} from '../utils/container-operations.js';
import {
  getSelectedContentModels,
  getTextSelection,
} from '../utils/selection.js';

function noneCodeBlockSelected(host: PageBlockComponent) {
  const selectedModels = getSelectedContentModels(host);
  return !selectedModels.every(model => model.flavour === 'affine:code');
}

interface InlineFormatConfigAction {
  host: PageBlockComponent;
  abortController: AbortController;
  format: AffineTextAttributes;
}

export interface InlineFormatConfig {
  id: string;
  name: string;
  disabledToolTip?: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  activeWhen: (format: AffineTextAttributes) => boolean;
  showWhen: (host: PageBlockComponent) => boolean;
  action: (props: InlineFormatConfigAction) => void;
}

export const inlineFormatConfig: InlineFormatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: `${SHORT_KEY}+b`,
    activeWhen: (format: AffineTextAttributes) => 'bold' in format,
    showWhen: (host: PageBlockComponent) => noneCodeBlockSelected(host),
    action: ({ host }) => {
      const textSelection = getTextSelection(host);
      assertExists(textSelection);
      handleFormat(host, textSelection, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: `${SHORT_KEY}+i`,
    activeWhen: (format: AffineTextAttributes) => 'italic' in format,
    showWhen: (host: PageBlockComponent) => noneCodeBlockSelected(host),
    action: ({ host }) => {
      const textSelection = getTextSelection(host);
      assertExists(textSelection);
      handleFormat(host, textSelection, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: `${SHORT_KEY}+u`,
    activeWhen: (format: AffineTextAttributes) => 'underline' in format,
    showWhen: (host: PageBlockComponent) => noneCodeBlockSelected(host),
    action: ({ host }) => {
      const textSelection = getTextSelection(host);
      assertExists(textSelection);
      handleFormat(host, textSelection, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: `${SHORT_KEY}+shift+s`,
    activeWhen: (format: AffineTextAttributes) => 'strike' in format,
    showWhen: (host: PageBlockComponent) => noneCodeBlockSelected(host),
    action: ({ host }) => {
      const textSelection = getTextSelection(host);
      assertExists(textSelection);
      handleFormat(host, textSelection, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: `${SHORT_KEY}+e`,
    activeWhen: (format: AffineTextAttributes) => 'code' in format,
    showWhen: (host: PageBlockComponent) => noneCodeBlockSelected(host),
    action: ({ host }) => {
      const textSelection = getTextSelection(host);
      assertExists(textSelection);
      handleFormat(host, textSelection, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: `${SHORT_KEY}+k`,
    activeWhen: (format: AffineTextAttributes) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (host: PageBlockComponent) => {
      const textSelection = getTextSelection(host);
      assertExists(textSelection);
      const selectedModels = getSelectedContentModels(host);
      return (
        selectedModels.length === 1 &&
        noneCodeBlockSelected(host) &&
        // can't create link when selection includes reference node
        // XXX get loose format at here is not a good practice
        !getCurrentCombinedFormat(host, textSelection, true).reference
      );
    },
    action: () => {
      // createLink(page);
      // if (format && abortController && !('link' in format)) {
      //   abortController.abort();
      // }
    },
  },
];
