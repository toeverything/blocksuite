// https://github.com/tldraw/tldraw/blob/6c7ee29625a21891a6ec05d5a6efdf64ccbaad5f/packages/core/src/types.ts
// https://github.com/tldraw/tldraw/blob/d721ae6a2f72cbfbeaca9e75ab833f89a0ef19f7/packages/tldraw/src/types.ts
export type Theme = 'dark' | 'light';

export enum TDShapeType {
  Sticky = 'sticky',
  Ellipse = 'ellipse',
  Rectangle = 'rectangle',
  Triangle = 'triangle',
  Draw = 'draw',
  Arrow = 'arrow',
  Line = 'line',
  Text = 'text',
  Group = 'group',
  Image = 'image',
  Video = 'video',
}
export enum ColorStyle {
  White = 'white',
  LightGray = 'lightGray',
  Gray = 'gray',
  Black = 'black',
  Green = 'green',
  Cyan = 'cyan',
  Blue = 'blue',
  Indigo = 'indigo',
  Violet = 'violet',
  Red = 'red',
  Orange = 'orange',
  Yellow = 'yellow',
}

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

export enum FontStyle {
  Script = 'script',
  Sans = 'sans',
  Serif = 'serif',
  Mono = 'mono',
}

export type ShapeStyles = {
  color: ColorStyle;
  size: SizeStyle;
  dash: DashStyle;
  font?: FontStyle;
  textAlign?: AlignStyle;
  isFilled?: boolean;
  scale?: number;
};

export type Patch<T> = Partial<{
  [P in keyof T]: T | Partial<T> | Patch<T[P]>;
}>;

export enum TLBoundsEdge {
  Top = 'top_edge',
  Right = 'right_edge',
  Bottom = 'bottom_edge',
  Left = 'left_edge',
}

export enum TLBoundsCorner {
  TopLeft = 'top_left_corner',
  TopRight = 'top_right_corner',
  BottomRight = 'bottom_right_corner',
  BottomLeft = 'bottom_left_corner',
}
export interface TLBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface TLBoundsWithCenter extends TLBounds {
  midX: number;
  midY: number;
}
export enum SnapPoints {
  minX = 'minX',
  midX = 'midX',
  maxX = 'maxX',
  minY = 'minY',
  midY = 'midY',
  maxY = 'maxY',
}

export type Snap =
  | { id: SnapPoints; isSnapped: false }
  | {
      id: SnapPoints;
      isSnapped: true;
      to: number;
      B: TLBoundsWithCenter;
      distance: number;
    };
