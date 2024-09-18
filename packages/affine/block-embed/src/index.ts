import type { ExtensionType } from '@blocksuite/block-std';

import { EmbedDragHandleOption } from './common/embed-block-element.js';
import { EmbedFigmaBlockSpec } from './embed-figma-block/index.js';
import { EmbedGithubBlockSpec } from './embed-github-block/index.js';
import { EmbedHtmlBlockSpec } from './embed-html-block/index.js';
import { EmbedLinkedDocBlockSpec } from './embed-linked-doc-block/index.js';
import { EmbedLoomBlockSpec } from './embed-loom-block/index.js';
import { EmbedSyncedDocBlockSpec } from './embed-synced-doc-block/index.js';
import { EmbedYoutubeBlockSpec } from './embed-youtube-block/index.js';

export const EmbedExtensions: ExtensionType[] = [
  EmbedDragHandleOption,
  EmbedFigmaBlockSpec,
  EmbedGithubBlockSpec,
  EmbedHtmlBlockSpec,
  EmbedLoomBlockSpec,
  EmbedYoutubeBlockSpec,
  EmbedLinkedDocBlockSpec,
  EmbedSyncedDocBlockSpec,
].flat();

export { EmbedBlockComponent } from './common/embed-block-element.js';
export {
  LinkPreviewer,
  type LinkPreviewResponseData,
} from './common/link-previewer.js';
export { toEdgelessEmbedBlock } from './common/to-edgeless-embed-block.js';

export * from './embed-figma-block/index.js';
export * from './embed-github-block/index.js';
export * from './embed-html-block/index.js';
export * from './embed-linked-doc-block/index.js';
export * from './embed-loom-block/index.js';
export * from './embed-synced-doc-block/index.js';
export * from './embed-youtube-block/index.js';
