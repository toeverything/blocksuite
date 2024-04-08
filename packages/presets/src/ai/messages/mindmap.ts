import type { EditorHost } from '@blocksuite/block-std';
import type {
  AffineAIPanelWidget,
  AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';
import { MiniMindmapPreview } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';

noop(MiniMindmapPreview);

export const createMindmapRenderer: (
  host: EditorHost,
  aiPanel: AffineAIPanelWidget
) => AffineAIPanelWidgetConfig['answerRenderer'] = (host, aiPanel) => {
  return (answer, state) => {
    if (state !== 'finished') {
      return nothing;
    }

    return html`<mini-mindmap-preview
      .aiPanel=${aiPanel}
      .host=${host}
      .answer=${answer}
    ></mini-mindmap-preview>`;
  };
};
