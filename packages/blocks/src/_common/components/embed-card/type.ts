import type {
  BookmarkBlockModel,
  EmbedFigmaModel,
  EmbedGithubModel,
  EmbedHtmlModel,
  EmbedLoomModel,
  EmbedYoutubeModel,
} from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import {
  EmbedFigmaBlockComponent,
  EmbedGithubBlockComponent,
  EmbedHtmlBlockComponent,
  EmbedLinkedDocBlockComponent,
  EmbedLoomBlockComponent,
  EmbedSyncedDocBlockComponent,
  EmbedYoutubeBlockComponent,
} from '@blocksuite/affine-block-embed';
import {
  EmbedLinkedDocModel,
  EmbedSyncedDocModel,
} from '@blocksuite/affine-model';

import { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';

export type ExternalEmbedBlockComponent =
  | BookmarkBlockComponent
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

export type EmbedBlockComponent =
  | LinkableEmbedBlockComponent
  | EmbedHtmlBlockComponent;

export type ExternalEmbedModel =
  | BookmarkBlockModel
  | EmbedFigmaModel
  | EmbedGithubModel
  | EmbedLoomModel
  | EmbedYoutubeModel;

export type InternalEmbedModel = EmbedLinkedDocModel | EmbedSyncedDocModel;

export type LinkableEmbedModel = ExternalEmbedModel | InternalEmbedModel;

export type EmbedModel = LinkableEmbedModel | EmbedHtmlModel;

export function isEmbedCardBlockComponent(
  block: BlockComponent
): block is EmbedBlockComponent {
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

export function isInternalEmbedModel(
  model: EmbedModel
): model is InternalEmbedModel {
  return (
    model instanceof EmbedLinkedDocModel || model instanceof EmbedSyncedDocModel
  );
}
