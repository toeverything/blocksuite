import type { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/index.js';
import type { EmbedLoomBlockComponent } from '../../../embed-loom-block/embed-loom-block.js';
import type { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';

export type EmbedToolbarBlock =
  | BookmarkBlockComponent
  | EmbedGithubBlockComponent
  | EmbedYoutubeBlockComponent
  | EmbedFigmaBlockComponent
  | EmbedLinkedDocBlockComponent
  | EmbedSyncedDocBlockComponent
  | EmbedLoomBlockComponent;
