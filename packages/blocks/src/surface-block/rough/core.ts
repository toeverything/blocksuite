import type { Point } from './geometry.js';
import type { Random } from './math.js';

export const SVGNS = 'http://www.w3.org/2000/svg';

export interface Config {
  options?: Options;
}

export interface DrawingSurface {
  height: SVGAnimatedLength | number;
  width: SVGAnimatedLength | number;
}

export interface Options {
  bowing?: number;
  curveFitting?: number;
  curveStepCount?: number;
  curveTightness?: number;
  dashGap?: number;
  dashOffset?: number;
  disableMultiStroke?: boolean;
  disableMultiStrokeFill?: boolean;
  fill?: string;
  fillLineDash?: number[];
  fillLineDashOffset?: number;
  fillStyle?: string;
  fillWeight?: number;
  fixedDecimalPlaceDigits?: number;
  hachureAngle?: number;
  hachureGap?: number;
  maxRandomnessOffset?: number;
  preserveVertices?: boolean;
  roughness?: number;
  seed?: number;
  simplification?: number;
  stroke?: string;
  strokeLineDash?: number[];
  strokeLineDashOffset?: number;
  strokeWidth?: number;
  zigzagOffset?: number;
}

export interface ResolvedOptions extends Options {
  bowing: number;
  curveFitting: number;
  curveStepCount: number;
  curveTightness: number;
  dashGap: number;
  dashOffset: number;
  disableMultiStroke: boolean;
  disableMultiStrokeFill: boolean;
  fillStyle: string;
  fillWeight: number;
  hachureAngle: number;
  hachureGap: number;
  maxRandomnessOffset: number;
  preserveVertices: boolean;
  randomizer?: Random;
  roughness: number;
  seed: number;
  stroke: string;
  strokeWidth: number;
  zigzagOffset: number;
}

export declare type OpType = 'bcurveTo' | 'lineTo' | 'move';
export declare type OpSetType = 'fillPath' | 'fillSketch' | 'path';

export interface Op {
  data: number[];
  op: OpType;
}

export interface OpSet {
  ops: Op[];
  path?: string;
  size?: Point;
  type: OpSetType;
}

export interface Drawable {
  options: ResolvedOptions;
  sets: OpSet[];
  shape: string;
}

export interface PathInfo {
  d: string;
  fill?: string;
  stroke: string;
  strokeWidth: number;
}
