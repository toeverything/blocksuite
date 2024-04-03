import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

type EditorMode = 'page' | 'edgeless';

export interface AffineAIItemGroupConfig {
  name?: string;
  items: AffineAIItemConfig[];
}

export interface AffineAIItemConfig extends AIActionItem {
  name: string;
  icon?: TemplateResult | (() => HTMLElement);
  showWhen?: (chain: Chain<InitCommandCtx>, editorMode: EditorMode) => boolean;
  subItems?: AffineAIItemConfig[];
}

export interface AIActionItem {
  actionId?: string;
  textToTextStream?: (doc: Doc, selected: string) => Promise<EventSource>;
}

export interface AIConfig {
  actionGroups: AffineAIItemGroupConfig[];
  getAskAIStream?: (doc: Doc, chat: string) => Promise<EventSource>;
}
