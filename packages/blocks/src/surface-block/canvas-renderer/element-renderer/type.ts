import type { ElementModel } from '../../element-model/base.js';
import type { Renderer } from '../renderer.js';

export type ElementRenderer = (
  model: ElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) => void;
