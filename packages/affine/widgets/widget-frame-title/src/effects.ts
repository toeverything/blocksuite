import { AFFINE_FRAME_TITLE, AffineFrameTitle } from './frame-title.js';
import { AFFINE_FRAME_TITLE_WIDGET, AffineFrameTitleWidget } from './index.js';

export function effects() {
  customElements.define(AFFINE_FRAME_TITLE_WIDGET, AffineFrameTitleWidget);
  customElements.define(AFFINE_FRAME_TITLE, AffineFrameTitle);
}
