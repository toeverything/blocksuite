import type { SurfaceElementModel } from '../../element-model/base.js';
import type { Renderer } from '../renderer.js';

export type ElementRenderer = (
  model: SurfaceElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) => void;
