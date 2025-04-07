import { AttachmentBlockSpec } from '@blocksuite/affine-block-attachment';
import { BookmarkBlockSpec } from '@blocksuite/affine-block-bookmark';
import { CalloutBlockSpec } from '@blocksuite/affine-block-callout';
import { CodeBlockSpec } from '@blocksuite/affine-block-code';
import { DataViewBlockSpec } from '@blocksuite/affine-block-data-view';
import { DatabaseBlockSpec } from '@blocksuite/affine-block-database';
import { DividerBlockSpec } from '@blocksuite/affine-block-divider';
import { EdgelessTextBlockSpec } from '@blocksuite/affine-block-edgeless-text';
import { EmbedExtensions } from '@blocksuite/affine-block-embed';
import { FrameBlockSpec } from '@blocksuite/affine-block-frame';
import { ImageBlockSpec } from '@blocksuite/affine-block-image';
import { LatexBlockSpec } from '@blocksuite/affine-block-latex';
import { ListBlockSpec } from '@blocksuite/affine-block-list';
import {
  EdgelessNoteBlockSpec,
  NoteBlockSpec,
} from '@blocksuite/affine-block-note';
import { ParagraphBlockSpec } from '@blocksuite/affine-block-paragraph';
import {
  EdgelessSurfaceBlockAdapterExtensions,
  EdgelessSurfaceBlockSpec,
  PageSurfaceBlockSpec,
  SurfaceBlockAdapterExtensions,
} from '@blocksuite/affine-block-surface';
import {
  EdgelessSurfaceRefBlockSpec,
  PageSurfaceRefBlockSpec,
} from '@blocksuite/affine-block-surface-ref';
import { TableBlockSpec } from '@blocksuite/affine-block-table';
import {
  brushToMarkdownAdapterMatcher,
  brushToPlainTextAdapterMatcher,
} from '@blocksuite/affine-gfx-brush';
import {
  connectorToMarkdownAdapterMatcher,
  connectorToPlainTextAdapterMatcher,
} from '@blocksuite/affine-gfx-connector';
import {
  groupToMarkdownAdapterMatcher,
  groupToPlainTextAdapterMatcher,
} from '@blocksuite/affine-gfx-group';
import {
  mindmapToMarkdownAdapterMatcher,
  mindmapToPlainTextAdapterMatcher,
} from '@blocksuite/affine-gfx-mindmap';
import {
  shapeToMarkdownAdapterMatcher,
  shapeToPlainTextAdapterMatcher,
} from '@blocksuite/affine-gfx-shape';
import {
  textToMarkdownAdapterMatcher,
  textToPlainTextAdapterMatcher,
} from '@blocksuite/affine-gfx-text';
import { inlinePresetExtensions } from '@blocksuite/affine-inline-preset';
import {
  DefaultOpenDocExtension,
  DocDisplayMetaService,
  EditPropsStore,
  FontLoaderService,
} from '@blocksuite/affine-shared/services';
import type { ExtensionType } from '@blocksuite/store';

const elementToPlainTextAdapterMatchers = [
  groupToPlainTextAdapterMatcher,
  shapeToPlainTextAdapterMatcher,
  connectorToPlainTextAdapterMatcher,
  brushToPlainTextAdapterMatcher,
  textToPlainTextAdapterMatcher,
  mindmapToPlainTextAdapterMatcher,
];

const elementToMarkdownAdapterMatchers = [
  groupToMarkdownAdapterMatcher,
  shapeToMarkdownAdapterMatcher,
  connectorToMarkdownAdapterMatcher,
  brushToMarkdownAdapterMatcher,
  textToMarkdownAdapterMatcher,
  mindmapToMarkdownAdapterMatcher,
];

export const CommonBlockSpecs: ExtensionType[] = [
  inlinePresetExtensions,
  DocDisplayMetaService,
  EditPropsStore,
  LatexBlockSpec,
  ListBlockSpec,
  DatabaseBlockSpec,
  TableBlockSpec,
  DataViewBlockSpec,
  DividerBlockSpec,
  BookmarkBlockSpec,
  EmbedExtensions,
  AttachmentBlockSpec,
  CodeBlockSpec,
  ImageBlockSpec,
  ParagraphBlockSpec,
  DefaultOpenDocExtension,
  FontLoaderService,
  CalloutBlockSpec,
  FrameBlockSpec,

  elementToPlainTextAdapterMatchers,
  elementToMarkdownAdapterMatchers,
].flat();

export const PageFirstPartyBlockSpecs: ExtensionType[] = [
  CommonBlockSpecs,
  NoteBlockSpec,
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,

  ...SurfaceBlockAdapterExtensions,
].flat();

export const EdgelessFirstPartyBlockSpecs: ExtensionType[] = [
  CommonBlockSpecs,

  EdgelessNoteBlockSpec,
  EdgelessSurfaceBlockSpec,
  EdgelessSurfaceRefBlockSpec,
  EdgelessTextBlockSpec,

  ...EdgelessSurfaceBlockAdapterExtensions,
].flat();
