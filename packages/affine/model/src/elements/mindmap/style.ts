import { isEqual, last } from '@blocksuite/global/utils';

import type { Color } from '../../consts/color.js';
import type { MindmapNode } from './mindmap.js';

import { ConnectorMode } from '../../consts/connector.js';
import { MindmapStyle } from '../../consts/mindmap.js';
import { StrokeStyle } from '../../consts/note.js';
import { FontFamily, FontWeight, TextResizing } from '../../consts/text.js';
import { DefaultTheme } from '../../consts/themes/default.js';

export type CollapseButton = {
  width: number;
  height: number;
  radius: number;

  filled: boolean;
  fillColor: Color;

  strokeColor: Color;
  strokeWidth: number;
};

export type ExpandButton = CollapseButton & {
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: FontWeight;

  color: Color;
};

export type NodeStyle = {
  radius: number;

  strokeWidth: number;
  strokeColor: Color;

  textResizing: TextResizing;

  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  color: Color;

  filled: boolean;
  fillColor: Color;

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
  stroke: Color;
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
    collapseButton: CollapseButton;
    expandButton: ExpandButton;
    node: NodeStyle;
  };
}

export class StyleOne extends MindmapStyleGetter {
  private _colorOrders = [
    DefaultTheme.StrokeColorMap.Purple,
    DefaultTheme.StrokeColorMap.Magenta,
    DefaultTheme.StrokeColorMap.Orange,
    DefaultTheme.StrokeColorMap.Yellow,
    DefaultTheme.StrokeColorMap.Green,
    '#7ae2d5',
  ];

  readonly root = {
    radius: 8,

    textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

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

  getNodeStyle(_: MindmapNode, path: number[]) {
    const color = this._getColor(path[1] ?? 0);

    return {
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: color,
        strokeWidth: 3,

        mode: ConnectorMode.Curve,
      },
      collapseButton: {
        width: 16,
        height: 16,
        radius: 0.5,

        filled: true,
        fillColor: '--affine-white',

        strokeColor: color,
        strokeWidth: 3,
      },
      expandButton: {
        width: 24,
        height: 24,
        radius: 8,

        filled: true,
        fillColor: color,

        strokeColor: color,
        strokeWidth: 0,

        padding: [4, 0],

        color: '--affine-white',

        fontFamily: FontFamily.Inter,
        fontWeight: FontWeight.Bold,
        fontSize: 15,
      },
      node: {
        radius: 8,

        textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

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
    DefaultTheme.FillColorMap.Blue,
    '#7ae2d5',
    DefaultTheme.FillColorMap.Yellow,
  ];

  readonly root = {
    radius: 3,

    textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

    strokeWidth: 3,
    strokeColor: '--affine-black',

    fontFamily: FontFamily.Poppins,
    fontSize: 18,
    fontWeight: FontWeight.SemiBold,
    color: DefaultTheme.FillColorMap.Black,

    filled: true,
    fillColor: DefaultTheme.FillColorMap.Orange,

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

  getNodeStyle(_: MindmapNode, path: number[]) {
    const color = this._getColor(path.length - 2);

    return {
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke: '--affine-black',
        strokeWidth: 3,

        mode: ConnectorMode.Orthogonal,
      },
      collapseButton: {
        width: 16,
        height: 16,
        radius: 0.5,

        filled: true,
        fillColor: '--affine-white',

        strokeColor: '--affine-black',
        strokeWidth: 3,
      },
      expandButton: {
        width: 24,
        height: 24,
        radius: 2,

        filled: true,
        fillColor: '--affine-black',

        padding: [4, 0],

        strokeColor: '--affine-black',
        strokeWidth: 0,

        color: '--affine-white',

        fontFamily: FontFamily.Inter,
        fontWeight: FontWeight.Bold,
        fontSize: 15,
      },
      node: {
        radius: 3,

        textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

        strokeWidth: 3,
        strokeColor: '--affine-black',

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.SemiBold,
        color: DefaultTheme.FillColorMap.Black,

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
  private _strokeColor = [
    DefaultTheme.StrokeColorMap.Yellow,
    DefaultTheme.StrokeColorMap.Green,
    DefaultTheme.StrokeColorMap.Teal,
  ];

  readonly root = {
    radius: 10,

    textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

    strokeWidth: 0,
    strokeColor: 'transparent',

    fontFamily: FontFamily.Poppins,
    fontSize: 16,
    fontWeight: FontWeight.Medium,
    color: DefaultTheme.FillColorMap.Black,

    filled: true,
    fillColor: DefaultTheme.FillColorMap.Yellow,

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

  override getNodeStyle(_: MindmapNode, path: number[]) {
    const strokeColor = this._getColor(path.length - 2);

    return {
      node: {
        radius: 10,

        textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

        strokeWidth: 2,
        strokeColor: strokeColor,

        fontFamily: FontFamily.Poppins,
        fontSize: 16,
        fontWeight: FontWeight.Medium,
        color: DefaultTheme.FillColorMap.Black,

        filled: true,
        fillColor: DefaultTheme.FillColorMap.White,

        padding: [6, 22] as [number, number],

        shadow: {
          blur: 12,
          offsetX: 0,
          offsetY: 0,
          color: 'rgba(66, 65, 73, 0.18)',
        },
      },
      collapseButton: {
        width: 16,
        height: 16,
        radius: 0.5,

        filled: true,
        fillColor: '--affine-white',

        strokeColor: '#3CBC36',
        strokeWidth: 3,
      },
      expandButton: {
        width: 24,
        height: 24,
        radius: 8,

        filled: true,
        fillColor: '#3CBC36',

        padding: [4, 0],

        strokeColor: '#3CBC36',
        strokeWidth: 0,

        color: '#fff',

        fontFamily: FontFamily.Inter,
        fontWeight: FontWeight.Bold,
        fontSize: 15,
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
    DefaultTheme.FillColorMap.Purple,
    DefaultTheme.FillColorMap.Magenta,
    DefaultTheme.FillColorMap.Orange,
    DefaultTheme.FillColorMap.Yellow,
    DefaultTheme.FillColorMap.Green,
    DefaultTheme.FillColorMap.Blue,
  ];

  readonly root = {
    radius: 0,

    textResizing: TextResizing.AUTO_WIDTH_AND_HEIGHT,

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

  getNodeStyle(_: MindmapNode, path: number[]) {
    const stroke = this._getColor(path[1] ?? 0);

    return {
      connector: {
        strokeStyle: StrokeStyle.Solid,
        stroke,
        strokeWidth: 3,

        mode: ConnectorMode.Curve,
      },
      collapseButton: {
        width: 16,
        height: 16,
        radius: 0.5,

        filled: true,
        fillColor: '--affine-white',

        strokeColor: stroke,
        strokeWidth: 3,
      },
      expandButton: {
        width: 24,
        height: 24,
        radius: 8,

        filled: true,
        fillColor: stroke,

        padding: [4, 0],

        strokeColor: stroke,
        strokeWidth: 0,

        color: '--affine-white',

        fontFamily: FontFamily.Inter,
        fontWeight: FontWeight.Bold,
        fontSize: 15,
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

export const mindmapStyleGetters: Record<MindmapStyle, MindmapStyleGetter> = {
  [MindmapStyle.ONE]: styleOne,
  [MindmapStyle.TWO]: styleTwo,
  [MindmapStyle.THREE]: styleThree,
  [MindmapStyle.FOUR]: styleFour,
};

export const applyNodeStyle = (node: MindmapNode, nodeStyle: NodeStyle) => {
  Object.entries(nodeStyle).forEach(([key, value]) => {
    // @ts-ignore
    if (!isEqual(node.element[key], value)) {
      // @ts-ignore
      node.element[key] = value;
    }
  });
};
