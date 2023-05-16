import type { StrokeStyle } from '../../consts.js';
import type { SerializedXYWH } from '../../utils/xywh.js';

export enum ConnectorMode {
  Straight,
  Orthogonal,
}

// x/y is in range of [0,1] relative to element's left-top
// real x = element.x + element.w * x
// real y = element.y + element.h * y
export interface AttachedElementPosition {
  x: number;
  y: number;
}

export interface AttachedElement {
  id: string;
  position: AttachedElementPosition;
}

export interface Controller {
  x: number;
  y: number;
  // If this value is true, it indicates that the point was generated by the user dragging
  customized?: boolean;
}

export interface IConnector {
  id: string;
  index: string;
  type: 'connector';
  xywh: SerializedXYWH;
  seed: number;

  mode: ConnectorMode;
  lineWidth: number;
  color: string;
  strokeStyle: StrokeStyle;

  startElement?: AttachedElement;
  endElement?: AttachedElement;

  // relative to element x,y.
  controllers: Controller[];
}
