import type { SurfaceNode } from '../../element-model/base.js';
import type { Renderer } from '../renderer.js';

export type ElementRenderer = (
  model: SurfaceNode,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) => void;
