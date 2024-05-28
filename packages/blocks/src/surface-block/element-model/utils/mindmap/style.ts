import { last } from '../../../../_common/utils/iterable.js';
import { FontFamily, FontWeight, StrokeStyle } from '../../../consts.js';
import type { LocalConnectorElementModel } from '../../connector.js';
import { ConnectorMode } from '../../connector.js';
import type { MindmapNode } from './layout.js';

export type NodeStyle = {
  radius: number;

  strokeWidth: number;
  strokeColor: string;

  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  color: string;

  filled: boolean;
  fillColor: string;
};

export type ConnectorStyle = {
  strokeStyle: StrokeStyle;
  stroke: string;
  strokeWidth: number;

  mode: ConnectorMode;
};

export abstract class MindmapStyleGetter {
  abstract readonly root: NodeStyle;

  abstract getNodeStyle(
    node: MindmapNode,
    path: number[]
  ): {
    connector: ConnectorStyle;
    node: NodeStyle;
  };
}

export class StyleOne extends MindmapStyleGetter {
  private _colorOrders = [
    '--affine-palette-line-purple',
    '--affine-palette-line-magenta',
    '--affine-palette-line-orange',
    '--affine-palette-line-yellow',
    '--affine-palette-line-green',
    '#7ae2d5',
  ];

  private _getColor(number: number) {
    return this._colorOrders[number % this._colorOrders.length];
  }

  readonly root = {
    radius: 8,

    strokeWidth: 2,
    strokeColor: '#84CFFF',

    fontFamily: FontFamily.Inter,
    fontSize: 14,
    fontWeight: FontWeight.SemiBold,
    color: '--affine-palette-shape-black',

    filled: true,
    fillColor: '--affine-palette-shape-white',
  };

  getNodeStyle(
    _: MindmapNode,
    path: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    const color = this._getColor(path[1] ?? 0);

    return {
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: color,
        strokeWidth: 2,

        mode: ConnectorMode.Curve,
      },
      node: {
        radius: 8,

        strokeWidth: 2,
        strokeColor: color,

        fontFamily: FontFamily.Inter,
        fontSize: 14,
        fontWeight: FontWeight.SemiBold,
        color: '--affine-palette-shape-black',

        filled: true,
        fillColor: '--affine-palette-shape-white',
      },
    };
  }
}
export const styleOne = new StyleOne();

export class StyleTwo extends MindmapStyleGetter {
  private _colorOrders = [
    '--affine-palette-shape-blue',
    '#7ae2d5',
    '--affine-palette-shape-yellow',
  ];

  private _getColor(number: number) {
    return number >= this._colorOrders.length
      ? last(this._colorOrders)!
      : this._colorOrders[number];
  }

  readonly root = {
    radius: 6,

    strokeWidth: 0,
    strokeColor: '--affine-palette-shape-orange',

    fontFamily: FontFamily.Inter,
    fontSize: 14,
    fontWeight: FontWeight.SemiBold,
    color: '--affine-palette-shape-black',

    filled: true,
    fillColor: '--affine-palette-shape-orange',
  };

  getNodeStyle(
    _: MindmapNode,
    path: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    const color = this._getColor(path.length - 2);

    return {
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: '--affine-palette-line-grey',
        strokeWidth: 2,

        mode: ConnectorMode.Curve,
      },
      node: {
        radius: 6,

        strokeWidth: 0,
        strokeColor: color,

        fontFamily: FontFamily.Inter,
        fontSize: 14,
        fontWeight: FontWeight.SemiBold,
        color: '--affine-palette-shape-black',

        filled: true,
        fillColor: color,
      },
    };
  }
}
export const styleTwo = new StyleTwo();

export class StyleThree extends MindmapStyleGetter {
  readonly root = {
    radius: 0,

    strokeWidth: 0,
    strokeColor: 'transparent',

    fontFamily: FontFamily.Inter,
    fontSize: 14,
    fontWeight: FontWeight.SemiBold,
    color: '--affine-palette-shape-magenta',

    filled: true,
    fillColor: 'transparent',
  };

  override getNodeStyle(
    _: MindmapNode,
    __: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    return {
      node: {
        radius: 0,

        strokeWidth: 0,
        strokeColor: 'transparent',

        fontFamily: FontFamily.Inter,
        fontSize: 14,
        fontWeight: FontWeight.SemiBold,
        color: '--affine-palette-shape-magenta',

        filled: true,
        fillColor: 'transparent',
      },
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: '--affine-palette-line-grey',
        strokeWidth: 2,

        mode: ConnectorMode.Curve,
      },
    };
  }
}
export const styleThree = new StyleThree();

export class StyleFour extends MindmapStyleGetter {
  readonly root = {
    radius: 0,

    strokeWidth: 2,
    strokeColor: '--affine-palette-line-grey',

    fontFamily: FontFamily.Inter,
    fontSize: 14,
    fontWeight: FontWeight.SemiBold,
    color: '--affine-text-primary-color',

    filled: true,
    fillColor: 'transparent',
  };

  getNodeStyle(
    _: MindmapNode,
    __: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    return {
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: '--affine-palette-line-grey',
        strokeWidth: 2,

        mode: ConnectorMode.Orthogonal,
      },
      node: this.root,
    };
  }
}
export const styleFour = new StyleFour();

export enum MindmapStyle {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
}

export const mindmapStyleGetters: {
  [key in MindmapStyle]: MindmapStyleGetter;
} = {
  [MindmapStyle.ONE]: styleOne,
  [MindmapStyle.TWO]: styleTwo,
  [MindmapStyle.THREE]: styleThree,
  [MindmapStyle.FOUR]: styleFour,
};

export const applyNodeStyle = (node: MindmapNode, nodeStyle: NodeStyle) => {
  Object.entries(nodeStyle).forEach(([key, value]) => {
    // @ts-ignore
    if (node.element[key] !== value) {
      // @ts-ignore
      node.element[key] = value;
    }
  });
};

export const applyConnectorStyle = (
  connector: LocalConnectorElementModel,
  style: ConnectorStyle
) => {
  Object.entries(style).forEach(([key, value]) => {
    // @ts-ignore
    connector[key] = value;
  });
};
