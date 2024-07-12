import type { ShapeElementModel } from '../../shape.js';
import type { MindmapNode } from './layout.js';

import { last } from '../../../../_common/utils/iterable.js';
import { fitContent } from '../../../canvas-renderer/element-renderer/shape/utils.js';
import { FontFamily, FontWeight, StrokeStyle } from '../../../consts.js';
import { ConnectorMode } from '../../connector.js';

export type NodeStyle = {
  color: string;

  fillColor: string;
  filled: boolean;

  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  padding: [number, number];

  radius: number;
  shadow?: {
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };

  strokeColor: string;

  strokeWidth: number;
};

export type ConnectorStyle = {
  mode: ConnectorMode;
  stroke: string;
  strokeStyle: StrokeStyle;

  strokeWidth: number;
};

export abstract class MindmapStyleGetter {
  abstract getNodeStyle(
    node: MindmapNode,
    path: number[]
  ): {
    connector: ConnectorStyle;
    node: NodeStyle;
  };

  abstract readonly root: NodeStyle;
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

  readonly root = {
    color: '--affine-black',

    fillColor: '--affine-white',
    filled: true,

    fontFamily: FontFamily.Poppins,
    fontSize: 20,
    fontWeight: FontWeight.SemiBold,
    padding: [11, 22] as [number, number],

    radius: 8,
    shadow: {
      blur: 12,
      color: 'rgba(0, 0, 0, 0.14)',
      offsetX: 0,
      offsetY: 6,
    },

    strokeColor: '#84CFFF',

    strokeWidth: 4,
  };

  private _getColor(number: number) {
    return this._colorOrders[number % this._colorOrders.length];
  }

  getNodeStyle(
    _: MindmapNode,
    path: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    const color = this._getColor(path[1] ?? 0);

    return {
      connector: {
        mode: ConnectorMode.Curve,
        stroke: color,
        strokeStyle: StrokeStyle.Solid,

        strokeWidth: 3,
      },
      node: {
        color: '--affine-black',

        fillColor: '--affine-white',
        filled: true,

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.Medium,
        padding: [6, 22] as [number, number],

        radius: 8,
        shadow: {
          blur: 12,
          color: 'rgba(0, 0, 0, 0.14)',
          offsetX: 0,
          offsetY: 6,
        },

        strokeColor: color,

        strokeWidth: 3,
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

  readonly root = {
    color: '--affine-palette-shape-black',

    fillColor: '--affine-palette-shape-orange',
    filled: true,

    fontFamily: FontFamily.Poppins,
    fontSize: 18,
    fontWeight: FontWeight.SemiBold,
    padding: [11, 22] as [number, number],

    radius: 3,
    shadow: {
      blur: 0,
      color: '--affine-black',
      offsetX: 3,
      offsetY: 3,
    },

    strokeColor: '--affine-black',

    strokeWidth: 3,
  };

  private _getColor(number: number) {
    return number >= this._colorOrders.length
      ? last(this._colorOrders)!
      : this._colorOrders[number];
  }

  getNodeStyle(
    _: MindmapNode,
    path: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    const color = this._getColor(path.length - 2);

    return {
      connector: {
        mode: ConnectorMode.Orthogonal,
        stroke: '--affine-black',
        strokeStyle: StrokeStyle.Solid,

        strokeWidth: 3,
      },
      node: {
        color: '--affine-palette-shape-black',

        fillColor: color,
        filled: true,

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.SemiBold,
        padding: [6, 22] as [number, number],

        radius: 3,
        shadow: {
          blur: 0,
          color: '--affine-black',
          offsetX: 3,
          offsetY: 3,
        },

        strokeColor: '--affine-black',

        strokeWidth: 3,
      },
    };
  }
}
export const styleTwo = new StyleTwo();

export class StyleThree extends MindmapStyleGetter {
  private _strokeColor = [
    '--affine-palette-line-yellow',
    '--affine-palette-line-green',
    '--affine-palette-line-teal',
  ];

  readonly root = {
    color: '--affine-palette-shape-black',

    fillColor: '--affine-palette-shape-yellow',
    filled: true,

    fontFamily: FontFamily.Poppins,
    fontSize: 16,
    fontWeight: FontWeight.Medium,
    padding: [10, 22] as [number, number],

    radius: 10,
    shadow: {
      blur: 12,
      color: 'rgba(66, 65, 73, 0.18)',
      offsetX: 0,
      offsetY: 0,
    },

    strokeColor: 'transparent',

    strokeWidth: 0,
  };

  private _getColor(number: number) {
    return this._strokeColor[number % this._strokeColor.length];
  }

  override getNodeStyle(
    _: MindmapNode,
    path: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    const strokeColor = this._getColor(path.length - 2);

    return {
      connector: {
        mode: ConnectorMode.Curve,
        stroke: strokeColor,
        strokeStyle: StrokeStyle.Solid,

        strokeWidth: 2,
      },
      node: {
        color: '--affine-palette-shape-black',

        fillColor: '--affine-palette-shape-white',
        filled: true,

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.Medium,
        padding: [6, 22] as [number, number],

        radius: 10,
        shadow: {
          blur: 12,
          color: 'rgba(66, 65, 73, 0.18)',
          offsetX: 0,
          offsetY: 0,
        },

        strokeColor: 'transparent',

        strokeWidth: 0,
      },
    };
  }
}
export const styleThree = new StyleThree();

export class StyleFour extends MindmapStyleGetter {
  private _colors = [
    '--affine-palette-shape-purple',
    '--affine-palette-shape-magenta',
    '--affine-palette-shape-orange',
    '--affine-palette-shape-yellow',
    '--affine-palette-shape-green',
    '--affine-palette-shape-blue',
  ];

  readonly root = {
    color: '--affine-black',

    fillColor: 'transparent',
    filled: true,

    fontFamily: FontFamily.Kalam,
    fontSize: 22,
    fontWeight: FontWeight.Bold,
    padding: [0, 10] as [number, number],

    radius: 0,
    strokeColor: 'transparent',

    strokeWidth: 0,
  };

  private _getColor(order: number) {
    return this._colors[order % this._colors.length];
  }

  getNodeStyle(
    _: MindmapNode,
    path: number[]
  ): { connector: ConnectorStyle; node: NodeStyle } {
    const stroke = this._getColor(path[1] ?? 0);

    return {
      connector: {
        mode: ConnectorMode.Curve,
        stroke,
        strokeStyle: StrokeStyle.Solid,

        strokeWidth: 3,
      },
      node: {
        ...this.root,

        fontSize: 18,
        padding: [1.5, 10] as [number, number],
      },
    };
  }
}
export const styleFour = new StyleFour();

export enum MindmapStyle {
  FOUR = 4,
  ONE = 1,
  THREE = 3,
  TWO = 2,
}

export const mindmapStyleGetters: {
  [key in MindmapStyle]: MindmapStyleGetter;
} = {
  [MindmapStyle.FOUR]: styleFour,
  [MindmapStyle.ONE]: styleOne,
  [MindmapStyle.THREE]: styleThree,
  [MindmapStyle.TWO]: styleTwo,
};

export const applyNodeStyle = (
  node: MindmapNode,
  nodeStyle: NodeStyle,
  shouldFitContent: boolean = false
) => {
  Object.entries(nodeStyle).forEach(([key, value]) => {
    // @ts-ignore
    if (node.element[key] !== value) {
      // @ts-ignore
      node.element[key] = value;
    }
  });

  shouldFitContent && fitContent(node.element as ShapeElementModel);
};
