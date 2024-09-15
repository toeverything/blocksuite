import type {
  BookmarkBlockModel,
  EmbedFigmaModel,
  EmbedGithubModel,
  EmbedLinkedDocModel,
  EmbedLoomModel,
  EmbedSyncedDocModel,
  EmbedYoutubeModel,
} from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import {
  EmbedFigmaBlockComponent,
  EmbedGithubBlockComponent,
  EmbedLoomBlockComponent,
  EmbedYoutubeBlockComponent,
} from '@blocksuite/affine-block-embed';

import { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/embed-linked-doc-block.js';
import { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';

export type EmbedToolbarBlockComponent =
  | BookmarkBlockComponent
  | EmbedGithubBlockComponent
  | EmbedYoutubeBlockComponent
  | EmbedFigmaBlockComponent
  | EmbedLinkedDocBlockComponent
  | EmbedSyncedDocBlockComponent
  | EmbedLoomBlockComponent;

export type EmbedToolbarModel =
  | BookmarkBlockModel
  | EmbedGithubModel
  | EmbedYoutubeModel
  | EmbedFigmaModel
  | EmbedLinkedDocModel
  | EmbedSyncedDocModel
  | EmbedLoomModel;

export function isEmbedCardBlockComponent(
  block: BlockComponent
): block is EmbedToolbarBlockComponent {
  return (
    block instanceof BookmarkBlockComponent ||
    block instanceof EmbedGithubBlockComponent ||
    block instanceof EmbedYoutubeBlockComponent ||
    block instanceof EmbedFigmaBlockComponent ||
    block instanceof EmbedLinkedDocBlockComponent ||
    block instanceof EmbedSyncedDocBlockComponent ||
    block instanceof EmbedLoomBlockComponent
  );
}
