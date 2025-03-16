import { AttachmentBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-attachment';
import { BookmarkBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-bookmark';
import { CodeBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-code';
import { DatabaseBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-database';
import { DividerBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-divider';
import {
  EmbedFigmaBlockNotionHtmlAdapterExtension,
  EmbedGithubBlockNotionHtmlAdapterExtension,
  EmbedLoomBlockNotionHtmlAdapterExtension,
  EmbedYoutubeBlockNotionHtmlAdapterExtension,
} from '@blocksuite/affine-block-embed';
import { ImageBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-image';
import { LatexBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-latex';
import { ListBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-list';
import { ParagraphBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-paragraph';
import { RootBlockNotionHtmlAdapterExtension } from '@blocksuite/affine-block-root';
import type { ExtensionType } from '@blocksuite/store';

export const defaultBlockNotionHtmlAdapterMatchers: ExtensionType[] = [
  ListBlockNotionHtmlAdapterExtension,
  ParagraphBlockNotionHtmlAdapterExtension,
  CodeBlockNotionHtmlAdapterExtension,
  DividerBlockNotionHtmlAdapterExtension,
  ImageBlockNotionHtmlAdapterExtension,
  RootBlockNotionHtmlAdapterExtension,
  BookmarkBlockNotionHtmlAdapterExtension,
  DatabaseBlockNotionHtmlAdapterExtension,
  LatexBlockNotionHtmlAdapterExtension,
  EmbedYoutubeBlockNotionHtmlAdapterExtension,
  EmbedFigmaBlockNotionHtmlAdapterExtension,
  EmbedGithubBlockNotionHtmlAdapterExtension,
  EmbedLoomBlockNotionHtmlAdapterExtension,
  AttachmentBlockNotionHtmlAdapterExtension,
];
