import { BookmarkBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-bookmark';
import { CodeBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-code';
import { DatabaseBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-database';
import { DividerBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-divider';
import {
  EmbedFigmaBlockPlainTextAdapterExtension,
  EmbedGithubBlockPlainTextAdapterExtension,
  EmbedIframeBlockPlainTextAdapterExtension,
  EmbedLinkedDocBlockPlainTextAdapterExtension,
  EmbedLoomBlockPlainTextAdapterExtension,
  EmbedSyncedDocBlockPlainTextAdapterExtension,
  EmbedYoutubeBlockPlainTextAdapterExtension,
} from '@blocksuite/affine-block-embed';
import { LatexBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-latex';
import { ListBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-list';
import { ParagraphBlockPlainTextAdapterExtension } from '@blocksuite/affine-block-paragraph';
import type { ExtensionType } from '@blocksuite/store';

export const defaultBlockPlainTextAdapterMatchers: ExtensionType[] = [
  ParagraphBlockPlainTextAdapterExtension,
  ListBlockPlainTextAdapterExtension,
  DividerBlockPlainTextAdapterExtension,
  CodeBlockPlainTextAdapterExtension,
  BookmarkBlockPlainTextAdapterExtension,
  EmbedFigmaBlockPlainTextAdapterExtension,
  EmbedGithubBlockPlainTextAdapterExtension,
  EmbedLoomBlockPlainTextAdapterExtension,
  EmbedYoutubeBlockPlainTextAdapterExtension,
  EmbedLinkedDocBlockPlainTextAdapterExtension,
  EmbedSyncedDocBlockPlainTextAdapterExtension,
  EmbedIframeBlockPlainTextAdapterExtension,
  LatexBlockPlainTextAdapterExtension,
  DatabaseBlockPlainTextAdapterExtension,
];
