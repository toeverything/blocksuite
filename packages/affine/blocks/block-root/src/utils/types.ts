import { BookmarkBlockComponent } from '@blocksuite/affine-block-bookmark';
import {
  EmbedFigmaBlockComponent,
  EmbedGithubBlockComponent,
  EmbedHtmlBlockComponent,
  EmbedLinkedDocBlockComponent,
  EmbedLoomBlockComponent,
  EmbedSyncedDocBlockComponent,
  EmbedYoutubeBlockComponent,
  type LinkableEmbedBlockComponent,
} from '@blocksuite/affine-block-embed';
import type { BlockComponent } from '@blocksuite/block-std';

export type BuiltInEmbedBlockComponent =
  | BookmarkBlockComponent
  | LinkableEmbedBlockComponent
  | EmbedHtmlBlockComponent;

export function isEmbedCardBlockComponent(
  block: BlockComponent
): block is BuiltInEmbedBlockComponent {
  return (
    block instanceof BookmarkBlockComponent ||
    block instanceof EmbedFigmaBlockComponent ||
    block instanceof EmbedGithubBlockComponent ||
    block instanceof EmbedHtmlBlockComponent ||
    block instanceof EmbedLoomBlockComponent ||
    block instanceof EmbedYoutubeBlockComponent ||
    block instanceof EmbedLinkedDocBlockComponent ||
    block instanceof EmbedSyncedDocBlockComponent
  );
}
