import type { EditorHost } from '@blocksuite/block-std';
import type { AffineAIPanelWidget } from '@blocksuite/blocks';

export type AIPanelResponseGenerator = (
  host: EditorHost
) => (panel: AffineAIPanelWidget) => Promise<void>;
