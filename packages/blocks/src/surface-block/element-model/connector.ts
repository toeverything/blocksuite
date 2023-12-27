import { DEFAULT_ROUGHNESS } from '../consts.js';
import { type BaseProps, ElementModel } from './base.js';
import type { StrokeStyle } from './common.js';

export type PointStyle = 'None' | 'Arrow' | 'Triangle' | 'Circle' | 'Diamond';

export type Connection = {
  id?: string;
  position: [number, number];
};

export enum ConnectorMode {
  Straight,
  Orthogonal,
  Curve,
}

type ConnectorElementProps = BaseProps & {
  mode: ConnectorMode;
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness?: number;
  rough?: boolean;
  source: Connection;
  target: Connection;

  frontEndpointStyle?: PointStyle;
  rearEndpointStyle?: PointStyle;
};

export class ConnectorElementModel extends ElementModel<ConnectorElementProps> {
  get mode() {
    return this.yMap.get('mode') as ConnectorElementProps['mode'];
  }

  get strokeWidth() {
    return this.yMap.get('strokeWidth') as ConnectorElementProps['strokeWidth'];
  }

  get stroke() {
    return this.yMap.get('stroke') as ConnectorElementProps['stroke'];
  }

  get strokeStyle() {
    return this.yMap.get('strokeStyle') as ConnectorElementProps['strokeStyle'];
  }

  get roughness() {
    return (
      (this.yMap.get('roughness') as ConnectorElementProps['roughness']) ??
      DEFAULT_ROUGHNESS
    );
  }

  get rough() {
    return (this.yMap.get('rough') as ConnectorElementProps['rough']) ?? false;
  }

  get target() {
    return this.yMap.get('target') as ConnectorElementProps['target'];
  }

  get source() {
    return this.yMap.get('source') as ConnectorElementProps['source'];
  }

  get frontEndpointStyle() {
    return (
      (this.yMap.get(
        'frontEndpointStyle'
      ) as ConnectorElementProps['frontEndpointStyle']) ?? 'None'
    );
  }

  get rearEndpointStyle() {
    return (
      (this.yMap.get(
        'rearEndpointStyle'
      ) as ConnectorElementProps['rearEndpointStyle']) ?? 'Arrow'
    );
  }
}
