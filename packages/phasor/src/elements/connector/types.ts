import type { Color } from '../../consts.js';

export type SerializedConnectorProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  lineWidth: number;
  color: Color;

  // relative to element x,y.
  // [x0, y0, x1, y1, x2, y2...]
  controllers: string;
};
