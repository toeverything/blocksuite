import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';

import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '../../icons/index.js';
import { toggleLink } from '../../page-block/utils/operations/element/inline-level.js';
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
    action: root => {
      const resetPayload = {
        root,
        styles: {
          reference: null,
        },
      };
      root.std.command
        .pipe()
        .try(chain => [
          chain.formatText(resetPayload),
          chain.formatBlock(resetPayload),
          chain.formatNative(resetPayload),
        ])
        .run()
        .then(() => {
          const textSelection = root.selection.find('text');
          assertExists(textSelection);
          toggleLink(root, textSelection);
        });
    },
  },
];
