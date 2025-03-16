import type { BlockComponent } from '@blocksuite/block-std';

import { EmbedFigmaBlockComponent } from './embed-figma-block';
import { EmbedGithubBlockComponent } from './embed-github-block';
import type { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block';
import { EmbedLoomBlockComponent } from './embed-loom-block';
import type { EmbedSyncedDocBlockComponent } from './embed-synced-doc-block';
import { EmbedYoutubeBlockComponent } from './embed-youtube-block';

export type ExternalEmbedBlockComponent =
  | EmbedFigmaBlockComponent
  | EmbedGithubBlockComponent
  | EmbedLoomBlockComponent
  | EmbedYoutubeBlockComponent;

export type InternalEmbedBlockComponent =
  | EmbedLinkedDocBlockComponent
  | EmbedSyncedDocBlockComponent;

export type LinkableEmbedBlockComponent =
  | ExternalEmbedBlockComponent
  | InternalEmbedBlockComponent;

export function isExternalEmbedBlockComponent(
  block: BlockComponent
): block is ExternalEmbedBlockComponent {
  return (
    block instanceof EmbedFigmaBlockComponent ||
    block instanceof EmbedGithubBlockComponent ||
    block instanceof EmbedLoomBlockComponent ||
    block instanceof EmbedYoutubeBlockComponent
  );
}
