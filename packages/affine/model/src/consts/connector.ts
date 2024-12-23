import { createEnumMap } from '../utils/enum.js';

export enum ConnectorEndpoint {
  Front = 'Front',
  Rear = 'Rear',
}

export enum PointStyle {
  Arrow = 'Arrow',
  Circle = 'Circle',
  Diamond = 'Diamond',
  None = 'None',
  Triangle = 'Triangle',
}

export const PointStyleMap = createEnumMap(PointStyle);

export const DEFAULT_FRONT_END_POINT_STYLE = PointStyle.None;

export const DEFAULT_REAR_END_POINT_STYLE = PointStyle.Arrow;

export const CONNECTOR_LABEL_MAX_WIDTH = 280;

export enum ConnectorLabelOffsetAnchor {
  Bottom = 'bottom',
  Center = 'center',
  Top = 'top',
}

export enum ConnectorMode {
  Straight,
  Orthogonal,
  Curve,
}
