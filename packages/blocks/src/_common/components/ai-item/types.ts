import type { Chain, EditorHost, InitCommandCtx } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import type { EditorMode } from '../../utils/index.js';

export interface AIItemGroupConfig {
  name?: string;
  items: AIItemConfig[];
}

export interface AIItemConfig {
  name: string;
  icon: TemplateResult | (() => HTMLElement);
  showWhen?: (chain: Chain<InitCommandCtx>, editorMode: EditorMode) => boolean;
  subItem?: AISubItemConfig[];
  handler?: (host: EditorHost) => void;
}

export interface AISubItemConfig {
  type: string;
  handler?: () => void;
}
