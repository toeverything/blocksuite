import type { ElementModel } from '../../index.js';
import type { Renderer } from '../renderer.js';
import { brush } from './brush/index.js';
import { connector } from './connector/index.js';
import { group } from './group/index.js';
import { shape } from './shape/index.js';
import { text } from './text/index.js';
export { normalizeShapeBound } from './shape/utils.js';

export type ElementRenderer<T extends ElementModel = ElementModel> = (
  model: T,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) => void;

export const modelRenderer = {
  brush,
  connector,
  group,
  shape,
  text,
} as {
  // @ts-ignore
  [key: string]: ElementRenderer<unknown>;
};
