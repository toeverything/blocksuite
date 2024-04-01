import type { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type {
  EmbedLinkedDocBlockComponent,
  EmbedLinkedDocModel,
} from '../../../embed-linked-doc-block/index.js';
import type { EmbedLoomBlockComponent } from '../../../embed-loom-block/embed-loom-block.js';
import type { EmbedLoomModel } from '../../../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';
import type { EmbedSyncedDocModel } from '../../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';

export type EmbedToolbarBlockElement =
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
