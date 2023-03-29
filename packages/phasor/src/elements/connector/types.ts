import type { Color } from '../../consts.js';

export type AttachedElementDirection = 'left' | 'top' | 'right' | 'bottom';

export interface AttachedElement {
  id: string;
  direction: AttachedElementDirection;
}

export type SerializedConnectorProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  lineWidth: number;
  color: Color;

  startElement?: AttachedElement;
  endElement?: AttachedElement;

  // relative to element x,y.
  // [x0, y0, x1, y1, x2, y2...]
  controllers: string;
};

export type ConnectorProperties = Partial<
  Pick<
    SerializedConnectorProps,
    'lineWidth' | 'color' | 'startElement' | 'endElement'
  >
>;
