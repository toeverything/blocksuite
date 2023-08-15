import type { BlockElement } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import {
  BoldIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '../../icons/index.js';
import type { Flavour } from '../../models.js';
import type { PageBlockComponent } from '../types.js';
import {
  formatByTextSelection,
  toggleLink,
} from '../utils/operations/element/inline-level.js';
import {
  getCombinedFormatInTextSelection,
  getSelectedContentModels,
} from '../utils/selection.js';

function handleCommonStyle({
  blockElement,
  type,
  style,
  value,
}: {
  blockElement: BlockElement;
  type: 'text' | 'block';
  style: keyof Omit<AffineTextAttributes, 'link' | 'reference'>;
  value: true | null;
}) {
  if (type === 'text') {
    const textSelection = blockElement.selection.find('text');
    assertExists(textSelection);
    formatByTextSelection(blockElement, textSelection, style, value);
  } else {
    const blockSelections = blockElement.selection.filter('block');
    const viewStore = blockElement.root.viewStore;
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
  blockElement: BlockElement;
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

const INLINE_UNSUPPORTED_MODELS: Flavour[] = [
  'affine:code',
  'affine:attachment',
];

export function noneInlineUnsupportedBlockSelected(
  pageElement: PageBlockComponent
) {
  const selectedModels = getSelectedContentModels(pageElement, [
    'text',
    'block',
  ]);
  return !selectedModels.every(model =>
    INLINE_UNSUPPORTED_MODELS.includes(model.flavour as Flavour)
  );
}

export const inlineFormatConfig: InlineFormatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'Mod-b',
    activeWhen: (format: AffineTextAttributes) => 'bold' in format,
    showWhen: (pageElement: PageBlockComponent) =>
      noneInlineUnsupportedBlockSelected(pageElement),
    action: ({ blockElement, type, format }) => {
      handleCommonStyle({
        blockElement,
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
      noneInlineUnsupportedBlockSelected(pageElement),
    action: ({ blockElement, type, format }) => {
      handleCommonStyle({
        blockElement,
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
      noneInlineUnsupportedBlockSelected(pageElement),
    action: ({ blockElement, type, format }) => {
      handleCommonStyle({
        blockElement,
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
      noneInlineUnsupportedBlockSelected(pageElement),
    action: ({ blockElement, type, format }) => {
      handleCommonStyle({
        blockElement,
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
      noneInlineUnsupportedBlockSelected(pageElement),
    action: ({ blockElement, type, format }) => {
      handleCommonStyle({
        blockElement,
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
      const textSelection = pageElement.selection.find('text');
      const selectedModels = getSelectedContentModels(pageElement, [
        'text',
        'block',
      ]);
      return (
        !!textSelection &&
        selectedModels.length === 1 &&
        noneInlineUnsupportedBlockSelected(pageElement) &&
        // can't create link when selection includes reference node
        // XXX get loose format at here is not a good practice
        !getCombinedFormatInTextSelection(pageElement, textSelection, true)
          .reference
      );
    },
    action: ({ blockElement }) => {
      const textSelection = blockElement.selection.find('text');
      assertExists(textSelection);
      toggleLink(blockElement, textSelection);
    },
  },
];
