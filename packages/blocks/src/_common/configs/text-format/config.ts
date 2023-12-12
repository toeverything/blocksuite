import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/virgo';
import type { TemplateResult } from 'lit';

import { toggleLinkPopup } from '../../components/rich-text/inline/nodes/link-node/link-popup/toggle-link-popup.js';
import type { AffineTextAttributes } from '../../components/rich-text/inline/types.js';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '../../icons/index.js';
import { commonActiveWhen, handleCommonStyle } from './utils.js';

export interface TextFormatConfig {
  id: string;
  name: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  activeWhen: (host: EditorHost) => boolean;
  action: (host: EditorHost) => void;
}

export const textFormatConfigs: TextFormatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'Mod-b',
    activeWhen: host => commonActiveWhen(host, 'bold'),
    action: host => {
      handleCommonStyle(host, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: 'Mod-i',
    activeWhen: host => commonActiveWhen(host, 'italic'),
    action: host => {
      handleCommonStyle(host, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: 'Mod-u',
    activeWhen: host => commonActiveWhen(host, 'underline'),
    action: host => {
      handleCommonStyle(host, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: 'Mod-shift-s',
    activeWhen: host => commonActiveWhen(host, 'strike'),
    action: host => {
      handleCommonStyle(host, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: CodeIcon,
    hotkey: 'Mod-e',
    activeWhen: host => commonActiveWhen(host, 'code'),
    action: host => {
      handleCommonStyle(host, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: 'Mod-k',
    activeWhen: host => commonActiveWhen(host, 'link'),
    action: () => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);

      const inlineRoot = range.commonAncestorContainer.parentElement?.closest<
        InlineRootElement<AffineTextAttributes>
      >(`[${INLINE_ROOT_ATTR}]`);
      if (!inlineRoot) return;

      const inlineEditor = inlineRoot.inlineEditor;
      const targetInlineRange = inlineEditor.getInlineRange();
      assertExists(targetInlineRange);

      if (targetInlineRange.length === 0) return;

      const format = inlineEditor.getFormat(targetInlineRange);
      if (format.link) {
        inlineEditor.formatText(targetInlineRange, { link: null });
        return;
      }

      toggleLinkPopup(inlineEditor, 'create', targetInlineRange);
    },
  },
];
