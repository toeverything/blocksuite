import type { SurfaceElementModel } from '../../element-model/base.js';
import type { CanvasRenderer } from '../canvas-renderer.js';

export type ElementRenderer = (
  model: SurfaceElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer
) => void;
