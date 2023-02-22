import type { IBound } from '../../consts.js';
import type { HitTestOptions } from '../base-element.js';

export type ShapeType =
  | 'rect'
  | 'triangle'
  | 'ellipse'
  | 'diamond'
  | 'roundedRect';

export interface ShapeRenderConfig {
  width: number;
  height: number;
  strokeWidth: number;
  fillColor?: string;
  strokeColor?: string;
  strokeStyle?: 'solid';
}

interface RenderSequenceStroke {
  type: 'stroke';
  path2d: Path2D;
  color?: string;
  width: number;
  style: ShapeRenderConfig['strokeStyle'];
}

interface RenderSequenceFill {
  type: 'fill';
  path2d: Path2D;
  color: string;
}

export type RenderSequenceItem = RenderSequenceFill | RenderSequenceStroke;

export interface ShapeUtils {
  createRenderSequence: (config: ShapeRenderConfig) => RenderSequenceItem[];
  hitTest: (
    point: [number, number],
    bound: IBound,
    options?: HitTestOptions
  ) => boolean;
}
