export type SerializedBrushProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  // [[x0,y0],[x1,y1]...]
  points: number[][];

  color: string;
  lineWidth: number;
};

export type CreateBrushProps = Omit<
  SerializedBrushProps,
  'id' | 'index' | 'xywh' | 'type'
>;
