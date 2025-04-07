import { EdgelessClipboardAttachmentConfig } from '@blocksuite/affine-block-attachment';
import { EdgelessClipboardBookmarkConfig } from '@blocksuite/affine-block-bookmark';
import { EdgelessClipboardEdgelessTextConfig } from '@blocksuite/affine-block-edgeless-text';
import {
  EdgelessClipboardEmbedFigmaConfig,
  EdgelessClipboardEmbedGithubConfig,
  EdgelessClipboardEmbedHtmlConfig,
  EdgelessClipboardEmbedIframeConfig,
  EdgelessClipboardEmbedLinkedDocConfig,
  EdgelessClipboardEmbedLoomConfig,
  EdgelessClipboardEmbedSyncedDocConfig,
  EdgelessClipboardEmbedYoutubeConfig,
} from '@blocksuite/affine-block-embed';
import { EdgelessClipboardFrameConfig } from '@blocksuite/affine-block-frame';
import { EdgelessClipboardImageConfig } from '@blocksuite/affine-block-image';
import { EdgelessClipboardNoteConfig } from '@blocksuite/affine-block-note';
import { ViewportElementExtension } from '@blocksuite/affine-shared/services';
import { autoConnectWidget } from '@blocksuite/affine-widget-edgeless-auto-connect';
import { edgelessToolbarWidget } from '@blocksuite/affine-widget-edgeless-toolbar';
import { frameTitleWidget } from '@blocksuite/affine-widget-frame-title';
import { edgelessRemoteSelectionWidget } from '@blocksuite/affine-widget-remote-selection';
import {
  BlockViewExtension,
  LifeCycleWatcher,
  WidgetViewExtension,
} from '@blocksuite/std';
import { GfxControllerIdentifier, ToolController } from '@blocksuite/std/gfx';
import type { ExtensionType } from '@blocksuite/store';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { CommonSpecs } from '../common-specs/index.js';
import { edgelessNavigatorBgWidget } from '../widgets/edgeless-navigator-bg/index.js';
import { AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET } from '../widgets/edgeless-zoom-toolbar/index.js';
import { EdgelessClipboardController } from './clipboard/clipboard.js';
import { NOTE_SLICER_WIDGET } from './components/note-slicer/index.js';
import { EDGELESS_DRAGGING_AREA_WIDGET } from './components/rects/edgeless-dragging-area-rect.js';
import { EDGELESS_SELECTED_RECT_WIDGET } from './components/rects/edgeless-selected-rect.js';
import { quickTools, seniorTools } from './components/toolbar/tools.js';
import { EdgelessRootService } from './edgeless-root-service.js';

export const edgelessZoomToolbarWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET,
  literal`${unsafeStatic(AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET)}`
);
export const edgelessDraggingAreaWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_DRAGGING_AREA_WIDGET,
  literal`${unsafeStatic(EDGELESS_DRAGGING_AREA_WIDGET)}`
);
export const noteSlicerWidget = WidgetViewExtension(
  'affine:page',
  NOTE_SLICER_WIDGET,
  literal`${unsafeStatic(NOTE_SLICER_WIDGET)}`
);
export const edgelessSelectedRectWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_SELECTED_RECT_WIDGET,
  literal`${unsafeStatic(EDGELESS_SELECTED_RECT_WIDGET)}`
);

class EdgelessLocker extends LifeCycleWatcher {
  static override key = 'edgeless-locker';

  override mounted() {
    const { viewport } = this.std.get(GfxControllerIdentifier);
    viewport.locked = true;
  }
}

const EdgelessClipboardConfigs: ExtensionType[] = [
  EdgelessClipboardNoteConfig,
  EdgelessClipboardEdgelessTextConfig,
  EdgelessClipboardImageConfig,
  EdgelessClipboardFrameConfig,
  EdgelessClipboardAttachmentConfig,
  EdgelessClipboardBookmarkConfig,
  EdgelessClipboardEmbedFigmaConfig,
  EdgelessClipboardEmbedGithubConfig,
  EdgelessClipboardEmbedHtmlConfig,
  EdgelessClipboardEmbedLoomConfig,
  EdgelessClipboardEmbedYoutubeConfig,
  EdgelessClipboardEmbedIframeConfig,
  EdgelessClipboardEmbedLinkedDocConfig,
  EdgelessClipboardEmbedSyncedDocConfig,
];

const EdgelessCommonExtension: ExtensionType[] = [
  CommonSpecs,
  ToolController,
  EdgelessRootService,
  ViewportElementExtension('.affine-edgeless-viewport'),
  ...quickTools,
  ...seniorTools,
  ...EdgelessClipboardConfigs,
].flat();

export const EdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root`),
  edgelessRemoteSelectionWidget,
  edgelessZoomToolbarWidget,
  frameTitleWidget,
  autoConnectWidget,
  edgelessDraggingAreaWidget,
  noteSlicerWidget,
  edgelessNavigatorBgWidget,
  edgelessSelectedRectWidget,
  edgelessToolbarWidget,
  EdgelessClipboardController,
];

export const PreviewEdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root-preview`),
  EdgelessLocker,
];
