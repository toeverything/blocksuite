import './_common/generating-placeholder.js';

import type { EditorHost } from '@blocksuite/block-std';
import type { AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import { MiniMindmapPreview } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { html } from 'lit';

noop(MiniMindmapPreview);

export const createMindmapRenderer: (
  host: EditorHost,
  /**
   * Used to store data for later use during rendering.
   */
  ctx: {
    get: () => Record<string, unknown>;
    set: (data: Record<string, unknown>) => void;
  }
) => AffineAIPanelWidgetConfig['answerRenderer'] = (host, ctx) => {
  return (answer, state) => {
    if (state !== 'finished') {
      return html`<ai-generating-placeholder></ai-generating-placeholder>`;
    }

    return html`<mini-mindmap-preview
      .ctx=${ctx}
      .host=${host}
      .answer=${answer}
    ></mini-mindmap-preview>`;
  };
};
