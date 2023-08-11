import {
  BoldIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
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
  toggleLink,
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
    hotkey: 'Mod-b',
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
    hotkey: 'Mod-i',
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
    hotkey: 'Mod-u',
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
    hotkey: 'Mod-shift-s',
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
    hotkey: 'Mod-e',
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
    hotkey: 'Mod-k',
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
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      toggleLink(pageElement, textSelection);
    },
  },
];
