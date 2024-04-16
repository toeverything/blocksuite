import type { Chain, EditorHost, InitCommandCtx } from '@blocksuite/block-std';
import type { EditorMode } from '@blocksuite/blocks';
import type { TemplateResult } from 'lit';

export interface AIItemGroupConfig {
  name?: string;
  items: AIItemConfig[];
}

export interface AIItemConfig {
  name: string;
  icon: TemplateResult | (() => HTMLElement);
  showWhen?: (
    chain: Chain<InitCommandCtx>,
    editorMode: EditorMode,
    host: EditorHost
  ) => boolean;
  subItem?: AISubItemConfig[];
  handler?: (host: EditorHost) => void;
}

export interface AISubItemConfig {
  type: string;
  handler?: (host: EditorHost) => void;
}
