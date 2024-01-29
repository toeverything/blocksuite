import type { AttachmentBlockModel } from '../attachment-block/attachment-model.js';
import type { BookmarkBlockModel } from '../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../embed-github-block/embed-github-model.js';
import type { EmbedHtmlModel } from '../embed-html-block/embed-html-model.js';
import type { EmbedLinkedDocModel } from '../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedYoutubeModel } from '../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../frame-block/index.js';
import type { ImageBlockModel } from '../image-block/image-model.js';
import type { NoteBlockModel } from '../note-block/note-model.js';

export type EdgelessBlockModelMap = {
  'affine:frame': FrameBlockModel;
  'affine:note': NoteBlockModel;
  'affine:image': ImageBlockModel;
  'affine:bookmark': BookmarkBlockModel;
  'affine:attachment': AttachmentBlockModel;
  'affine:embed-github': EmbedGithubModel;
  'affine:embed-youtube': EmbedYoutubeModel;
  'affine:embed-figma': EmbedFigmaModel;
  'affine:embed-linked-doc': EmbedLinkedDocModel;
  'affine:embed-html': EmbedHtmlModel;
};

export type EdgelessBlockType =
  | 'affine:frame'
  | 'affine:note'
  | 'affine:image'
  | 'affine:bookmark'
  | 'affine:attachment'
  | 'affine:embed-github'
  | 'affine:embed-youtube'
  | 'affine:embed-figma'
  | 'affine:embed-linked-doc'
  | 'affine:embed-html';

export type EdgelessElementType =
  | EdgelessBlockType
  | 'shape'
  | 'brush'
  | 'connector'
  | 'text'
  | 'group'
  | 'debug';
