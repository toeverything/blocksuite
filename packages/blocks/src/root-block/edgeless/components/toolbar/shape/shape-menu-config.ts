import type { TemplateResult } from 'lit';

import type { ShapeTool } from '../../../controllers/tools/shape-tool.js';

import {
  DiamondIcon,
  EllipseIcon,
  RoundedRectangleIcon,
  ScribbledDiamondIcon,
  ScribbledEllipseIcon,
  ScribbledRoundedRectangleIcon,
  ScribbledSquareIcon,
  ScribbledTriangleIcon,
  SquareIcon,
  TriangleIcon,
} from '../../../../../_common/icons/index.js';
import { ShapeType } from '../../../../../surface-block/index.js';

const { Diamond, Ellipse, Rect, Triangle } = ShapeType;

type Config = {
  disabled: boolean;
  generalIcon: TemplateResult<1>;
  name: ShapeTool['shapeType'];
  scribbledIcon: TemplateResult<1>;
  tooltip: string;
  value: Record<string, unknown>;
};

export const ShapeComponentConfig: Config[] = [
  {
    disabled: false,
    generalIcon: SquareIcon,
    name: Rect,
    scribbledIcon: ScribbledSquareIcon,
    tooltip: 'Square',
    value: {
      radius: 0,
      shapeType: Rect,
    },
  },
  {
    disabled: false,
    generalIcon: EllipseIcon,
    name: Ellipse,
    scribbledIcon: ScribbledEllipseIcon,
    tooltip: 'Ellipse',
    value: {
      shapeType: Ellipse,
    },
  },
  {
    disabled: false,
    generalIcon: DiamondIcon,
    name: Diamond,
    scribbledIcon: ScribbledDiamondIcon,
    tooltip: 'Diamond',
    value: {
      shapeType: Diamond,
    },
  },
  {
    disabled: false,
    generalIcon: TriangleIcon,
    name: Triangle,
    scribbledIcon: ScribbledTriangleIcon,
    tooltip: 'Triangle',
    value: {
      shapeType: Triangle,
    },
  },
  {
    disabled: false,
    generalIcon: RoundedRectangleIcon,
    name: 'roundedRect',
    scribbledIcon: ScribbledRoundedRectangleIcon,
    tooltip: 'Rounded rectangle',
    value: {
      radius: 0.1,
      shapeType: Rect,
    },
  },
];

export const ShapeComponentConfigMap = ShapeComponentConfig.reduce(
  (acc, config) => {
    acc[config.name] = config;
    return acc;
  },
  {} as Record<Config['name'], Config>
);

export const SHAPE_COLOR_PREFIX = '--affine-palette-shape-';
export const LINE_COLOR_PREFIX = '--affine-palette-line-';
