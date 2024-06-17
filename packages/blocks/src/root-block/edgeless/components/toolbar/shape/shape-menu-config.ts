import type { TemplateResult } from 'lit';

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
import type { ShapeTool } from '../../../controllers/tools/shape-tool.js';

const { Rect, Ellipse, Triangle, Diamond } = ShapeType;

type Config = {
  name: ShapeTool['shapeType'];
  generalIcon: TemplateResult<1>;
  scribbledIcon: TemplateResult<1>;
  tooltip: string;
  disabled: boolean;
  value: Record<string, unknown>;
};

export const ShapeComponentConfig: Config[] = [
  {
    name: Rect,
    generalIcon: SquareIcon,
    scribbledIcon: ScribbledSquareIcon,
    tooltip: 'Square',
    disabled: false,
    value: {
      shapeType: Rect,
      radius: 0,
    },
  },
  {
    name: Ellipse,
    generalIcon: EllipseIcon,
    scribbledIcon: ScribbledEllipseIcon,
    tooltip: 'Ellipse',
    disabled: false,
    value: {
      shapeType: Ellipse,
    },
  },
  {
    name: Diamond,
    generalIcon: DiamondIcon,
    scribbledIcon: ScribbledDiamondIcon,
    tooltip: 'Diamond',
    disabled: false,
    value: {
      shapeType: Diamond,
    },
  },
  {
    name: Triangle,
    generalIcon: TriangleIcon,
    scribbledIcon: ScribbledTriangleIcon,
    tooltip: 'Triangle',
    disabled: false,
    value: {
      shapeType: Triangle,
    },
  },
  {
    name: 'roundedRect',
    generalIcon: RoundedRectangleIcon,
    scribbledIcon: ScribbledRoundedRectangleIcon,
    tooltip: 'Rounded rectangle',
    disabled: false,
    value: {
      shapeType: Rect,
      radius: 0.1,
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
