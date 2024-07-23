import type { BlockComponent } from '@blocksuite/block-std';

import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedLoomModel } from '../../../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocModel } from '../../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';

import { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import {
  EmbedLinkedDocBlockComponent,
  type EmbedLinkedDocModel,
} from '../../../embed-linked-doc-block/index.js';
import { EmbedLoomBlockComponent } from '../../../embed-loom-block/embed-loom-block.js';
import { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';
import { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';

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
