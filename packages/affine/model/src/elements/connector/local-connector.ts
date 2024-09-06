import type { PointLocation, SerializedXYWH } from '@blocksuite/global/utils';

import { GfxLocalElementModel } from '@blocksuite/block-std/gfx';

import type { Connection } from './connector.js';

import {
  type Color,
  ConnectorMode,
  DEFAULT_ROUGHNESS,
  type PointStyle,
  StrokeStyle,
} from '../../consts/index.js';

export class LocalConnectorElementModel extends GfxLocalElementModel {
  private _path: PointLocation[] = [];

  absolutePath: PointLocation[] = [];

  frontEndpointStyle!: PointStyle;

  id: string = '';

  mode: ConnectorMode = ConnectorMode.Orthogonal;

  rearEndpointStyle!: PointStyle;

  rotate: number = 0;

  rough?: boolean;

  roughness: number = DEFAULT_ROUGHNESS;

  seed: number = Math.random();

  source: Connection = {
    position: [0, 0],
  };

  stroke: Color = '#000000';

  strokeStyle: StrokeStyle = StrokeStyle.Solid;

  strokeWidth: number = 4;

  target: Connection = {
    position: [0, 0],
  };

  updatingPath = false;

  xywh: SerializedXYWH = '[0,0,0,0]';

  get path(): PointLocation[] {
    return this._path;
  }

  set path(value: PointLocation[]) {
    const { x, y } = this;

    this._path = value;
    this.absolutePath = value.map(p => p.clone().setVec([p[0] + x, p[1] + y]));
  }

  get type() {
    return 'connector';
  }
}

declare global {
  namespace BlockSuite {
    interface SurfaceLocalModelMap {
      connector: LocalConnectorElementModel;
    }
  }
}
