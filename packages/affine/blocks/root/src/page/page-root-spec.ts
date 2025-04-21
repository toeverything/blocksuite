import { ViewportElementExtension } from '@blocksuite/affine-shared/services';
import { keyboardToolbarWidget } from '@blocksuite/affine-widget-keyboard-toolbar';
import { IS_MOBILE } from '@blocksuite/global/env';
import { BlockViewExtension, WidgetViewExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { PageClipboard } from '../clipboard/page-clipboard.js';
import { CommonSpecs } from '../common-specs/index.js';
import { AFFINE_PAGE_DRAGGING_AREA_WIDGET } from '../widgets/page-dragging-area/page-dragging-area.js';
import { PageRootService } from './page-root-service.js';

export const pageDraggingAreaWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_PAGE_DRAGGING_AREA_WIDGET,
  literal`${unsafeStatic(AFFINE_PAGE_DRAGGING_AREA_WIDGET)}`
);

const PageCommonExtension: ExtensionType[] = [
  CommonSpecs,
  PageRootService,
  pageDraggingAreaWidget,
  ViewportElementExtension('.affine-page-viewport'),
].flat();

export const PageRootBlockSpec: ExtensionType[] = [
  ...PageCommonExtension,
  BlockViewExtension('affine:page', literal`affine-page-root`),
  IS_MOBILE ? [keyboardToolbarWidget] : [],
  PageClipboard,
].flat();

export const PreviewPageRootBlockSpec: ExtensionType[] = [
  ...PageCommonExtension,
  BlockViewExtension('affine:page', literal`affine-preview-root`),
];
