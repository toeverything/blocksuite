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
} from '../utils/operations/inline.js';
import {
  getSelectedContentModels,
  getTextSelection,
} from '../utils/selection.js';

function noneCodeBlockSelected(pageElement: PageBlockComponent) {
  const selectedModels = getSelectedContentModels(pageElement);
  return !selectedModels.every(model => model.flavour === 'affine:code');
}

interface InlineFormatConfigAction {
  pageElement: PageBlockComponent;
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
  showWhen: (pageElement: PageBlockComponent) => boolean;
  action: (props: InlineFormatConfigAction) => void;
}

export const inlineFormatConfig: InlineFormatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: `${SHORT_KEY}+b`,
    activeWhen: (format: AffineTextAttributes) => 'bold' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneCodeBlockSelected(pageElement),
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      handleFormat(pageElement, textSelection, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: `${SHORT_KEY}+i`,
    activeWhen: (format: AffineTextAttributes) => 'italic' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneCodeBlockSelected(pageElement),
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      handleFormat(pageElement, textSelection, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: `${SHORT_KEY}+u`,
    activeWhen: (format: AffineTextAttributes) => 'underline' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneCodeBlockSelected(pageElement),
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      handleFormat(pageElement, textSelection, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: `${SHORT_KEY}+shift+s`,
    activeWhen: (format: AffineTextAttributes) => 'strike' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneCodeBlockSelected(pageElement),
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      handleFormat(pageElement, textSelection, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: `${SHORT_KEY}+e`,
    activeWhen: (format: AffineTextAttributes) => 'code' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneCodeBlockSelected(pageElement),
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      handleFormat(pageElement, textSelection, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: `${SHORT_KEY}+k`,
    activeWhen: (format: AffineTextAttributes) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (pageElement: PageBlockComponent) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      const selectedModels = getSelectedContentModels(pageElement);
      return (
        selectedModels.length === 1 &&
        noneCodeBlockSelected(pageElement) &&
        // can't create link when selection includes reference node
        // XXX get loose format at here is not a good practice
        !getCurrentCombinedFormat(pageElement, textSelection, true).reference
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
