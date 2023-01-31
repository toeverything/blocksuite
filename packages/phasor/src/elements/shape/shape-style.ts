// https://github.com/tldraw/tldraw/blob/6c7ee29625a21891a6ec05d5a6efdf64ccbaad5f/packages/core/src/types.ts
// https://github.com/tldraw/tldraw/blob/d721ae6a2f72cbfbeaca9e75ab833f89a0ef19f7/packages/tldraw/src/types.ts
import { Utils } from '../../utils/tl-utils.js';

export type Theme = 'dark' | 'light';

export enum SizeStyle {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum DashStyle {
  Draw = 'draw',
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted',
}

export enum FontSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  ExtraLarge = 'extraLarge',
}

export enum AlignStyle {
  Start = 'start',
  Middle = 'middle',
  End = 'end',
  Justify = 'justify',
}

export type ShapeStyles = {
  color: `#${string}`;
  size: SizeStyle;
  dash: DashStyle;
  font?: FontStyle;
  textAlign?: AlignStyle;
  isFilled?: boolean;
  scale?: number;
};

export enum FontStyle {
  Script = 'script',
  Sans = 'sans',
  Serif = 'serif',
  Mono = 'mono',
}

const strokeWidths = {
  [SizeStyle.Small]: 2,
  [SizeStyle.Medium]: 3.5,
  [SizeStyle.Large]: 5,
};

const canvasLight = '#fafafa';

function getStrokeWidth(size: SizeStyle): number {
  return strokeWidths[size];
}

export function getShapeStyle(style: ShapeStyles): {
  stroke: string;
  fill: string;
  strokeWidth: number;
} {
  const { color, size, isFilled } = style;

  const strokeWidth = getStrokeWidth(size);
  if (color.startsWith('#')) {
    const stroke = style.color as `#${string}`;
    const fill = Utils.lerpColor(color, canvasLight, 0.45);
    return {
      stroke,
      fill,
      strokeWidth,
    };
  } else {
    const color = style.color;
    return {
      stroke: color,
      fill: isFilled ? color : 'none',
      strokeWidth,
    };
  }
}
