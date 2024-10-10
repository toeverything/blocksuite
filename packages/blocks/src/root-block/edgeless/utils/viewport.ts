import type { GfxModel, Viewport } from '@blocksuite/block-std/gfx';

import { Bound, getCommonBound } from '@blocksuite/global/utils';

import { FIT_TO_SCREEN_PADDING } from './consts.js';
import { ZOOM_INITIAL } from './zoom.js';

export function fitToScreen(
  elements: GfxModel[],
  viewport: Viewport,
  options: {
    padding?: [number, number, number, number];
    smooth?: boolean;
  } = {
    padding: [0, 0, 0, 0],
    smooth: true,
  }
) {
  const elemBounds = elements.map(element => Bound.deserialize(element.xywh));
  const commonBound = getCommonBound(elemBounds);
  const { zoom, centerX, centerY } = viewport.getFitToScreenData(
    commonBound,
    options.padding,
    ZOOM_INITIAL,
    FIT_TO_SCREEN_PADDING
  );

  viewport.setViewport(zoom, [centerX, centerY], options.smooth);
}
