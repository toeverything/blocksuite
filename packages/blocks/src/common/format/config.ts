import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { VIRGO_ROOT_ATTR, type VirgoRootElement } from '@blocksuite/virgo';
import type { TemplateResult } from 'lit';

import { toggleLinkPopup } from '../../components/rich-text/virgo/nodes/link-node/link-popup/toggle-link-popup.js';
import type { AffineTextAttributes } from '../../components/rich-text/virgo/types.js';
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '../../icons/index.js';
import { commonActiveWhen, handleCommonStyle } from './utils.js';

export interface formatConfig {
  id: string;
  name: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  activeWhen: (root: BlockSuiteRoot) => boolean;
  action: (root: BlockSuiteRoot) => void;
}

export const formatConfig: formatConfig[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'Mod-b',
    activeWhen: root => commonActiveWhen(root, 'bold'),
    action: root => {
      handleCommonStyle(root, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: 'Mod-i',
    activeWhen: root => commonActiveWhen(root, 'italic'),
    action: root => {
      handleCommonStyle(root, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: 'Mod-u',
    activeWhen: root => commonActiveWhen(root, 'underline'),
    action: root => {
      handleCommonStyle(root, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: 'Mod-shift-s',
    activeWhen: root => commonActiveWhen(root, 'strike'),
    action: root => {
      handleCommonStyle(root, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: CodeIcon,
    hotkey: 'Mod-e',
    activeWhen: root => commonActiveWhen(root, 'code'),
    action: root => {
      handleCommonStyle(root, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: 'Mod-k',
    activeWhen: root => commonActiveWhen(root, 'link'),
    action: () => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);

      const vRoot = range.commonAncestorContainer.parentElement?.closest<
        VirgoRootElement<AffineTextAttributes>
      >(`[${VIRGO_ROOT_ATTR}]`);
      if (!vRoot) return;

      const vEditor = vRoot.virgoEditor;
      const vText =
        range.commonAncestorContainer.parentElement?.closest(
          '[data-virgo-text]'
        );
      if (!vText) return;
      const goalVRange = vEditor.getVRangeFromElement(vText);
      assertExists(goalVRange);
      toggleLinkPopup(vEditor, 'create', goalVRange);
    },
  },
];
