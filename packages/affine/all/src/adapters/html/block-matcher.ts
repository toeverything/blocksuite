import { BookmarkBlockHtmlAdapterExtension } from '@blocksuite/affine-block-bookmark';
import { CodeBlockHtmlAdapterExtension } from '@blocksuite/affine-block-code';
import { DatabaseBlockHtmlAdapterExtension } from '@blocksuite/affine-block-database';
import { DividerBlockHtmlAdapterExtension } from '@blocksuite/affine-block-divider';
import {
  EmbedFigmaBlockHtmlAdapterExtension,
  EmbedGithubBlockHtmlAdapterExtension,
  EmbedIframeBlockHtmlAdapterExtension,
  EmbedLinkedDocHtmlAdapterExtension,
  EmbedLoomBlockHtmlAdapterExtension,
  EmbedSyncedDocBlockHtmlAdapterExtension,
  EmbedYoutubeBlockHtmlAdapterExtension,
} from '@blocksuite/affine-block-embed';
import { ImageBlockHtmlAdapterExtension } from '@blocksuite/affine-block-image';
import { ListBlockHtmlAdapterExtension } from '@blocksuite/affine-block-list';
import { ParagraphBlockHtmlAdapterExtension } from '@blocksuite/affine-block-paragraph';
import { RootBlockHtmlAdapterExtension } from '@blocksuite/affine-block-root';
import { TableBlockHtmlAdapterExtension } from '@blocksuite/affine-block-table';

export const defaultBlockHtmlAdapterMatchers = [
  ListBlockHtmlAdapterExtension,
  ParagraphBlockHtmlAdapterExtension,
  CodeBlockHtmlAdapterExtension,
  DividerBlockHtmlAdapterExtension,
  ImageBlockHtmlAdapterExtension,
  RootBlockHtmlAdapterExtension,
  EmbedYoutubeBlockHtmlAdapterExtension,
  EmbedFigmaBlockHtmlAdapterExtension,
  EmbedLoomBlockHtmlAdapterExtension,
  EmbedGithubBlockHtmlAdapterExtension,
  EmbedIframeBlockHtmlAdapterExtension,
  BookmarkBlockHtmlAdapterExtension,
  DatabaseBlockHtmlAdapterExtension,
  TableBlockHtmlAdapterExtension,
  EmbedLinkedDocHtmlAdapterExtension,
  EmbedSyncedDocBlockHtmlAdapterExtension,
];
