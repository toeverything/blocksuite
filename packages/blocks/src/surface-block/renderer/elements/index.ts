import type { IBound } from '@blocksuite/global/utils';

import type { RoughCanvas, SurfaceElementModel } from '../../index.js';
import type { CanvasRenderer } from '../canvas-renderer.js';

import { brush } from './brush/index.js';
import { connector } from './connector/index.js';
import { group } from './group/index.js';
import { mindmap } from './mindmap.js';
import { shape } from './shape/index.js';
import { text } from './text/index.js';
export { normalizeShapeBound } from './shape/utils.js';

export type ElementRenderer<
  T extends BlockSuite.SurfaceElementModel = SurfaceElementModel,
> = (
  model: T,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer,
  rc: RoughCanvas,
  viewportBound: IBound
) => void;

export const elementRenderers = {
  brush,
  connector,
  group,
  shape,
  text,
  mindmap,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as Record<string, ElementRenderer<any>>;
