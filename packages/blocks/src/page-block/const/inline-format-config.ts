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
import type { Flavour } from '../../models.js';
import type { PageBlockComponent } from '../types.js';
import {
  formatByTextSelection,
  toggleLink,
} from '../utils/operations/element/inline-level.js';
import {
  getBlockSelections,
  getCombinedFormatInTextSelection,
  getSelectedContentModels,
  getTextSelection,
} from '../utils/selection.js';

const UNSUPPORTED_MODELS: Flavour[] = ['affine:code', 'affine:attachment'];

function noneUnsupportedBlockSelected(pageElement: PageBlockComponent) {
  const selectedModels = getSelectedContentModels(pageElement);
  return !selectedModels.every(model =>
    UNSUPPORTED_MODELS.includes(model.flavour as Flavour)
  );
}

function handleCommonStyle({
  pageElement,
  type,
  style,
  value,
}: {
  pageElement: PageBlockComponent;
  type: 'text' | 'block';
  style: keyof Omit<AffineTextAttributes, 'link' | 'reference'>;
  value: true | null;
}) {
  if (type === 'text') {
    const textSelection = getTextSelection(pageElement);
    assertExists(textSelection);
    formatByTextSelection(pageElement, textSelection, style, value);
  } else {
    const blockSelections = getBlockSelections(pageElement);
    const viewStore = pageElement.root.viewStore;
    for (const blockSelection of blockSelections) {
      const blockElement = viewStore.viewFromPath('block', blockSelection.path);
      if (blockElement && blockElement.model.text) {
        blockElement.model.text.format(0, blockElement.model.text.length, {
          [style]: value,
        });
      }
    }
  }
}

interface InlineFormatConfigAction {
  pageElement: PageBlockComponent;
  type: 'text' | 'block';
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
      noneUnsupportedBlockSelected(pageElement),
    action: ({ pageElement, type, format }) => {
      handleCommonStyle({
        pageElement,
        type,
        style: 'bold',
        value: format.bold ? null : true,
      });
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: 'Mod-i',
    activeWhen: (format: AffineTextAttributes) => 'italic' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneUnsupportedBlockSelected(pageElement),
    action: ({ pageElement, type, format }) => {
      handleCommonStyle({
        pageElement,
        type,
        style: 'italic',
        value: format.italic ? null : true,
      });
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: 'Mod-u',
    activeWhen: (format: AffineTextAttributes) => 'underline' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneUnsupportedBlockSelected(pageElement),
    action: ({ pageElement, type, format }) => {
      handleCommonStyle({
        pageElement,
        type,
        style: 'underline',
        value: format.underline ? null : true,
      });
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: 'Mod-shift-s',
    activeWhen: (format: AffineTextAttributes) => 'strike' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneUnsupportedBlockSelected(pageElement),
    action: ({ pageElement, type, format }) => {
      handleCommonStyle({
        pageElement,
        type,
        style: 'strike',
        value: format.strike ? null : true,
      });
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: 'Mod-e',
    activeWhen: (format: AffineTextAttributes) => 'code' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneUnsupportedBlockSelected(pageElement),
    action: ({ pageElement, type, format }) => {
      handleCommonStyle({
        pageElement,
        type,
        style: 'code',
        value: format.code ? null : true,
      });
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
      const selectedModels = getSelectedContentModels(pageElement);
      return (
        !!textSelection &&
        selectedModels.length === 1 &&
        noneUnsupportedBlockSelected(pageElement) &&
        // can't create link when selection includes reference node
        // XXX get loose format at here is not a good practice
        !getCombinedFormatInTextSelection(pageElement, textSelection, true)
          .reference
      );
    },
    action: ({ pageElement }) => {
      const textSelection = getTextSelection(pageElement);
      assertExists(textSelection);
      toggleLink(pageElement, textSelection);
    },
  },
];
