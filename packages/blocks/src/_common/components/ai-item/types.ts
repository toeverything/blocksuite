import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
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
  /**
   * TODO：add parameter to the handler function and implement the logic under each handler item
   */
  handler?: () => void;
}

export interface AISubItemConfig {
  type: string;
  handler?: () => void;
}
