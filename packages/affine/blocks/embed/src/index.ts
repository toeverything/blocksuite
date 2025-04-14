import type { ExtensionType } from '@blocksuite/store';

import { EmbedFigmaBlockSpec } from './embed-figma-block';
import { EmbedGithubBlockSpec } from './embed-github-block';
import { EmbedHtmlBlockSpec } from './embed-html-block';
import { EmbedIframeBlockSpec } from './embed-iframe-block';
import { EmbedLinkedDocBlockSpec } from './embed-linked-doc-block';
import { EmbedLoomBlockSpec } from './embed-loom-block';
import { EmbedSyncedDocBlockSpec } from './embed-synced-doc-block';
import { EmbedYoutubeBlockSpec } from './embed-youtube-block';

export const EmbedExtensions: ExtensionType[] = [
  // External embed blocks
  EmbedFigmaBlockSpec,
  EmbedGithubBlockSpec,
  EmbedLoomBlockSpec,
  EmbedYoutubeBlockSpec,

  // Internal embed blocks
  EmbedHtmlBlockSpec,
  EmbedLinkedDocBlockSpec,
  EmbedSyncedDocBlockSpec,
  EmbedIframeBlockSpec,
].flat();

export { createEmbedBlockHtmlAdapterMatcher } from './common/adapters/html';
export { createEmbedBlockMarkdownAdapterMatcher } from './common/adapters/markdown';
export { createEmbedBlockPlainTextAdapterMatcher } from './common/adapters/plain-text';
export { EmbedBlockComponent } from './common/embed-block-element';
export { insertEmbedCard } from './common/insert-embed-card';
export * from './common/render-linked-doc';
export { toEdgelessEmbedBlock } from './common/to-edgeless-embed-block';
export * from './common/utils';
export * from './embed-figma-block';
export * from './embed-github-block';
export * from './embed-html-block';
export * from './embed-iframe-block';
export * from './embed-linked-doc-block';
export * from './embed-loom-block';
export * from './embed-synced-doc-block';
export * from './embed-youtube-block';
export * from './types';
