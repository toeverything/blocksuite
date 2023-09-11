import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';

import type { AffineTextAttributes } from '../__internal__/rich-text/virgo/types.js';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '../icons/index.js';
import type { Flavour } from '../models.js';
import {
  formatByTextSelection,
  toggleLink,
} from '../page-block/utils/operations/element/inline-level.js';
import {
  getCombinedFormatInTextSelection,
  getSelectedContentModels,
} from '../page-block/utils/selection.js';

function handleCommonStyle({
  root,
  type,
  style,
  value,
}: {
  root: BlockSuiteRoot;
  type: 'text' | 'block';
  style: keyof Omit<AffineTextAttributes, 'link' | 'reference'>;
  value: true | null;
}) {
  if (type === 'text') {
    const textSelection = root.selection.find('text');
    assertExists(textSelection);
    formatByTextSelection(root, textSelection, style, value);
  } else {
    const blockSelections = root.selection.filter('block');
    const viewStore = root.view;
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
  root: BlockSuiteRoot;
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
  showWhen: (root: BlockSuiteRoot) => boolean;
  action: (props: InlineFormatConfigAction) => void;
}

const INLINE_SUPPORTED_MODELS: Flavour[] = ['affine:paragraph', 'affine:list'];

export function includeInlineSupportedBlockSelected(root: BlockSuiteRoot) {
  const selectedModels = getSelectedContentModels(root, ['text', 'block']);
  return selectedModels.some(model =>
    INLINE_SUPPORTED_MODELS.includes(model.flavour as Flavour)
  );
}

export const inlineFormatConfig: InlineFormatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'Mod-b',
    activeWhen: (format: AffineTextAttributes) => 'bold' in format,
    showWhen: root => includeInlineSupportedBlockSelected(root),
    action: ({ root, type, format }) => {
      handleCommonStyle({
        root,
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
    showWhen: root => includeInlineSupportedBlockSelected(root),
    action: ({ root, type, format }) => {
      handleCommonStyle({
        root,
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
    showWhen: root => includeInlineSupportedBlockSelected(root),
    action: ({ root, type, format }) => {
      handleCommonStyle({
        root,
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
    showWhen: root => includeInlineSupportedBlockSelected(root),
    action: ({ root, type, format }) => {
      handleCommonStyle({
        root,
        type,
        style: 'strike',
        value: format.strike ? null : true,
      });
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: CodeIcon,
    hotkey: 'Mod-e',
    activeWhen: (format: AffineTextAttributes) => 'code' in format,
    showWhen: root => includeInlineSupportedBlockSelected(root),
    action: ({ root, type, format }) => {
      handleCommonStyle({
        root,
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
    showWhen: root => {
      const textSelection = root.selection.find('text');
      const selectedModels = getSelectedContentModels(root, ['text', 'block']);
      return (
        !!textSelection &&
        selectedModels.length === 1 &&
        includeInlineSupportedBlockSelected(root) &&
        // can't create link when selection includes reference node
        // XXX get loose format at here is not a good practice
        !getCombinedFormatInTextSelection(root, textSelection, true).reference
      );
    },
    action: ({ root }) => {
      const textSelection = root.selection.find('text');
      assertExists(textSelection);
      toggleLink(root, textSelection);
    },
  },
];
