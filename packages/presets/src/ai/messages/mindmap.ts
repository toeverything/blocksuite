import './_common/generating-placeholder.js';

import type { EditorHost } from '@blocksuite/block-std';
import type {
  AffineAIPanelWidgetConfig,
  MindmapStyle,
} from '@blocksuite/blocks';
import { markdownToMindmap, MiniMindmapPreview } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';

noop(MiniMindmapPreview);

export const createMindmapRenderer: (
  host: EditorHost,
  /**
   * Used to store data for later use during rendering.
   */
  ctx: {
    get: () => Record<string, unknown>;
    set: (data: Record<string, unknown>) => void;
  },
  style?: MindmapStyle
) => AffineAIPanelWidgetConfig['answerRenderer'] = (host, ctx, style) => {
  return (answer, state) => {
    if (state === 'generating') {
      return html`<ai-generating-placeholder></ai-generating-placeholder>`;
    }

    if (state !== 'finished' && state !== 'error') {
      return nothing;
    }

    return html`<mini-mindmap-preview
      .ctx=${ctx}
      .host=${host}
      .answer=${answer}
      .mindmapStyle=${style}
      .templateShow=${style === undefined}
    ></mini-mindmap-preview>`;
  };
};

/**
 * Creates a renderer for executing a handler.
 * The ai panel will not display anything after the answer is generated.
 */
export const createMindmapExecuteRenderer: (
  host: EditorHost,
  /**
   * Used to store data for later use during rendering.
   */
  ctx: {
    get: () => Record<string, unknown>;
    set: (data: Record<string, unknown>) => void;
  },
  handler: (ctx: {
    get: () => Record<string, unknown>;
    set: (data: Record<string, unknown>) => void;
  }) => void
) => AffineAIPanelWidgetConfig['answerRenderer'] = (_, ctx, handler) => {
  return (answer, state) => {
    if (state !== 'finished') {
      return html`<ai-generating-placeholder
        .height=${100}
      ></ai-generating-placeholder>`;
    }

    ctx.set({
      node: markdownToMindmap(answer),
    });

    handler(ctx);

    return nothing;
  };
};
