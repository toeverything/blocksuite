import { WidgetViewExtension } from '@blocksuite/std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { AFFINE_VIEWPORT_OVERLAY_WIDGET } from '../widgets/viewport-overlay/viewport-overlay.js';

export const viewportOverlayWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_VIEWPORT_OVERLAY_WIDGET,
  literal`${unsafeStatic(AFFINE_VIEWPORT_OVERLAY_WIDGET)}`
);
