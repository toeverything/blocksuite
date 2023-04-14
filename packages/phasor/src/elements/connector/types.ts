import type { Color } from '../../consts.js';

export enum ConnectorMode {
  Straight,
  Orthogonal,
}

// x/y is in range of [0,1] relative to element's left-top
// real x = element.x + element.w * x
// real y = element.y + element.h * y
export type AttachedElementPosition = {
  x: number;
  y: number;
};

export interface AttachedElement {
  id: string;
  position: AttachedElementPosition;
}

export type Controller = {
  x: number;
  y: number;
  // If this value is true, it indicates that the point was generated by the user dragging
  customized?: boolean;
};

export type SerializedConnectorProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  mode: ConnectorMode;
  lineWidth: number;
  color: string;

  startElement?: AttachedElement;
  endElement?: AttachedElement;

  // relative to element x,y.
  // JSON.stringify(Controller[])
  controllers: string;
};

export type ConnectorProps = Partial<
  Pick<
    SerializedConnectorProps,
    'mode' | 'lineWidth' | 'color' | 'startElement' | 'endElement'
  >
>;
