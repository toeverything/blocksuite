import { last } from '@blocksuite/global/utils';

import type { MindmapNode } from './mindmap.js';

import { ConnectorMode } from '../../consts/connector.js';
import { LineColor } from '../../consts/line.js';
import { MindmapStyle } from '../../consts/mindmap.js';
import { StrokeStyle } from '../../consts/note.js';
import { ShapeFillColor } from '../../consts/shape.js';
import { FontFamily, FontWeight } from '../../consts/text.js';

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

  padding: [number, number];

  shadow?: {
    blur: number;
    offsetX: number;
    offsetY: number;
    color: string;
  };
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
    LineColor.Purple,
    LineColor.Magenta,
    LineColor.Orange,
    LineColor.Yellow,
    LineColor.Green,
    '#7ae2d5',
  ];

  readonly root = {
    radius: 8,

    strokeWidth: 4,
    strokeColor: '#84CFFF',

    fontFamily: FontFamily.Poppins,
    fontSize: 20,
    fontWeight: FontWeight.SemiBold,
    color: '--affine-black',

    filled: true,
    fillColor: '--affine-white',

    padding: [11, 22] as [number, number],

    shadow: {
      offsetX: 0,
      offsetY: 6,
      blur: 12,
      color: 'rgba(0, 0, 0, 0.14)',
    },
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
        strokeStyle: StrokeStyle.Solid,
        stroke: color,
        strokeWidth: 3,

        mode: ConnectorMode.Curve,
      },
      node: {
        radius: 8,

        strokeWidth: 3,
        strokeColor: color,

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.Medium,
        color: '--affine-black',

        filled: true,
        fillColor: '--affine-white',

        padding: [6, 22] as [number, number],

        shadow: {
          offsetX: 0,
          offsetY: 6,
          blur: 12,
          color: 'rgba(0, 0, 0, 0.14)',
        },
      },
    };
  }
}
export const styleOne = new StyleOne();

export class StyleTwo extends MindmapStyleGetter {
  private _colorOrders = [
    ShapeFillColor.Blue,
    '#7ae2d5',
    ShapeFillColor.Yellow,
  ];

  readonly root = {
    radius: 3,

    strokeWidth: 3,
    strokeColor: '--affine-black',

    fontFamily: FontFamily.Poppins,
    fontSize: 18,
    fontWeight: FontWeight.SemiBold,
    color: ShapeFillColor.Black,

    filled: true,
    fillColor: ShapeFillColor.Orange,

    padding: [11, 22] as [number, number],

    shadow: {
      blur: 0,
      offsetX: 3,
      offsetY: 3,
      color: '--affine-black',
    },
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
        strokeStyle: StrokeStyle.Solid,
        stroke: '--affine-black',
        strokeWidth: 3,

        mode: ConnectorMode.Orthogonal,
      },
      node: {
        radius: 3,

        strokeWidth: 3,
        strokeColor: '--affine-black',

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.SemiBold,
        color: ShapeFillColor.Black,

        filled: true,
        fillColor: color,

        padding: [6, 22] as [number, number],

        shadow: {
          blur: 0,
          offsetX: 3,
          offsetY: 3,
          color: '--affine-black',
        },
      },
    };
  }
}
export const styleTwo = new StyleTwo();

export class StyleThree extends MindmapStyleGetter {
  private _strokeColor = [LineColor.Yellow, LineColor.Green, LineColor.Teal];

  readonly root = {
    radius: 10,

    strokeWidth: 0,
    strokeColor: 'transparent',

    fontFamily: FontFamily.Poppins,
    fontSize: 16,
    fontWeight: FontWeight.Medium,
    color: ShapeFillColor.Black,

    filled: true,
    fillColor: ShapeFillColor.Yellow,

    padding: [10, 22] as [number, number],

    shadow: {
      blur: 12,
      offsetX: 0,
      offsetY: 0,
      color: 'rgba(66, 65, 73, 0.18)',
    },
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
      node: {
        radius: 10,

        strokeWidth: 0,
        strokeColor: 'transparent',

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.Medium,
        color: ShapeFillColor.Black,

        filled: true,
        fillColor: ShapeFillColor.White,

        padding: [6, 22] as [number, number],

        shadow: {
          blur: 12,
          offsetX: 0,
          offsetY: 0,
          color: 'rgba(66, 65, 73, 0.18)',
        },
      },
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: strokeColor,
        strokeWidth: 2,

        mode: ConnectorMode.Curve,
      },
    };
  }
}
export const styleThree = new StyleThree();

export class StyleFour extends MindmapStyleGetter {
  private _colors = [
    ShapeFillColor.Purple,
    ShapeFillColor.Magenta,
    ShapeFillColor.Orange,
    ShapeFillColor.Yellow,
    ShapeFillColor.Green,
    ShapeFillColor.Blue,
  ];

  readonly root = {
    radius: 0,

    strokeWidth: 0,
    strokeColor: 'transparent',

    fontFamily: FontFamily.Kalam,
    fontSize: 22,
    fontWeight: FontWeight.Bold,
    color: '--affine-black',

    filled: true,
    fillColor: 'transparent',

    padding: [0, 10] as [number, number],
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
        strokeStyle: StrokeStyle.Solid,
        stroke,
        strokeWidth: 3,

        mode: ConnectorMode.Curve,
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
