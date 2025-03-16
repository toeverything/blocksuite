import { BookmarkBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-bookmark';
import { CodeBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-code';
import { DatabaseBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-database';
import { DividerBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-divider';
import {
  EmbedFigmaMarkdownAdapterExtension,
  EmbedGithubMarkdownAdapterExtension,
  EmbedIframeBlockMarkdownAdapterExtension,
  EmbedLinkedDocMarkdownAdapterExtension,
  EmbedLoomMarkdownAdapterExtension,
  EmbedSyncedDocMarkdownAdapterExtension,
  EmbedYoutubeMarkdownAdapterExtension,
} from '@blocksuite/affine-block-embed';
import { ImageBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-image';
import { LatexBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-latex';
import { ListBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-list';
import { DocNoteBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-note';
import { ParagraphBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-paragraph';
import { RootBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-root';
import { TableBlockMarkdownAdapterExtension } from '@blocksuite/affine-block-table';

export const defaultBlockMarkdownAdapterMatchers = [
  RootBlockMarkdownAdapterExtension,
  DocNoteBlockMarkdownAdapterExtension,
  EmbedFigmaMarkdownAdapterExtension,
  EmbedGithubMarkdownAdapterExtension,
  EmbedLinkedDocMarkdownAdapterExtension,
  EmbedLoomMarkdownAdapterExtension,
  EmbedSyncedDocMarkdownAdapterExtension,
  EmbedYoutubeMarkdownAdapterExtension,
  EmbedIframeBlockMarkdownAdapterExtension,
  ListBlockMarkdownAdapterExtension,
  ParagraphBlockMarkdownAdapterExtension,
  BookmarkBlockMarkdownAdapterExtension,
  CodeBlockMarkdownAdapterExtension,
  DatabaseBlockMarkdownAdapterExtension,
  TableBlockMarkdownAdapterExtension,
  DividerBlockMarkdownAdapterExtension,
  ImageBlockMarkdownAdapterExtension,
  LatexBlockMarkdownAdapterExtension,
];
