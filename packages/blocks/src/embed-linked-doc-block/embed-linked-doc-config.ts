import type { EditorHost } from '@blocksuite/block-std';

export interface EmbedLinkedDocBlockConfig {
  handleClick?: (e: MouseEvent, host: EditorHost) => void;
  handleDoubleClick?: (e: MouseEvent, host: EditorHost) => void;
}
