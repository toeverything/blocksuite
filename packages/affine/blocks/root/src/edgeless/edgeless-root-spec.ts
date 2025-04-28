import { ViewportElementExtension } from '@blocksuite/affine-shared/services';
import {
  BlockViewExtension,
  LifeCycleWatcher,
  WidgetViewExtension,
} from '@blocksuite/std';
import { GfxControllerIdentifier, ToolController } from '@blocksuite/std/gfx';
import type { ExtensionType } from '@blocksuite/store';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { CommonSpecs } from '../common-specs/index.js';
import { AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET } from '../widgets/edgeless-zoom-toolbar/index.js';
import { EdgelessClipboardController } from './clipboard/clipboard.js';
import { NOTE_SLICER_WIDGET } from './components/note-slicer/index.js';
import { EDGELESS_DRAGGING_AREA_WIDGET } from './components/rects/edgeless-dragging-area-rect.js';
import { EDGELESS_SELECTED_RECT_WIDGET } from './components/rects/edgeless-selected-rect.js';
import { quickTools } from './components/toolbar/tools.js';
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

const EdgelessCommonExtension: ExtensionType[] = [
  CommonSpecs,
  ToolController,
  EdgelessRootService,
  ViewportElementExtension('.affine-edgeless-viewport'),
  ...quickTools,
].flat();

export const EdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root`),
  edgelessZoomToolbarWidget,
  edgelessDraggingAreaWidget,
  noteSlicerWidget,
  edgelessSelectedRectWidget,
  EdgelessClipboardController,
];

export const PreviewEdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root-preview`),
  EdgelessLocker,
];
