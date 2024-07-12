import type { EditorHost } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '../../icons/index.js';

export interface TextFormatConfig {
  action: (host: EditorHost) => void;
  activeWhen: (host: EditorHost) => boolean;
  hotkey?: string;
  icon: TemplateResult<1>;
  id: string;
  name: string;
}

export const textFormatConfigs: TextFormatConfig[] = [
  {
    action: host => {
      host.std.command.chain().toggleBold().run();
    },
    activeWhen: host => {
      const [result] = host.std.command
        .chain()
        .isTextStyleActive({ key: 'bold' })
        .run();
      return result;
    },
    hotkey: 'Mod-b',
    icon: BoldIcon,
    id: 'bold',
    name: 'Bold',
  },
  {
    action: host => {
      host.std.command.chain().toggleItalic().run();
    },
    activeWhen: host => {
      const [result] = host.std.command
        .chain()
        .isTextStyleActive({ key: 'italic' })
        .run();
      return result;
    },
    hotkey: 'Mod-i',
    icon: ItalicIcon,
    id: 'italic',
    name: 'Italic',
  },
  {
    action: host => {
      host.std.command.chain().toggleUnderline().run();
    },
    activeWhen: host => {
      const [result] = host.std.command
        .chain()
        .isTextStyleActive({ key: 'underline' })
        .run();
      return result;
    },
    hotkey: 'Mod-u',
    icon: UnderlineIcon,
    id: 'underline',
    name: 'Underline',
  },
  {
    action: host => {
      host.std.command.chain().toggleStrike().run();
    },
    activeWhen: host => {
      const [result] = host.std.command
        .chain()
        .isTextStyleActive({ key: 'strike' })
        .run();
      return result;
    },
    hotkey: 'Mod-shift-s',
    icon: StrikethroughIcon,
    id: 'strike',
    name: 'Strikethrough',
  },
  {
    action: host => {
      host.std.command.chain().toggleCode().run();
    },
    activeWhen: host => {
      const [result] = host.std.command
        .chain()
        .isTextStyleActive({ key: 'code' })
        .run();
      return result;
    },
    hotkey: 'Mod-e',
    icon: CodeIcon,
    id: 'code',
    name: 'Code',
  },
  {
    action: host => {
      host.std.command.chain().toggleLink().run();
    },
    activeWhen: host => {
      const [result] = host.std.command
        .chain()
        .isTextStyleActive({ key: 'link' })
        .run();
      return result;
    },
    hotkey: 'Mod-k',
    icon: LinkIcon,
    id: 'link',
    name: 'Link',
  },
];
