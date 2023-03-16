import type { Color } from '../../consts.js';

export type SerializedBrushProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  // [[x0,y0],[x1,y1]...]
  points: string;

  color: Color;
  lineWidth: number;
};

type BrushPropsKeys = keyof Omit<
  SerializedBrushProps,
  'id' | 'type' | 'xywh' | 'points'
>;

export type BrushProps = Partial<Pick<SerializedBrushProps, BrushPropsKeys>>;
