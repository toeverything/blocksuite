import type { TemplateResult } from 'lit';

import type { ShapeTool } from '../../../../../__internal__/index.js';
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
} from '../../../../../icons/index.js';

type Config = {
  name: ShapeTool['shape'];
  generalIcon: TemplateResult<1>;
  scribbledIcon: TemplateResult<1>;
  tooltip: string;
  disabled: boolean;
};

export const ShapeComponentConfig: Config[] = [
  {
    name: 'rect',
    generalIcon: SquareIcon,
    scribbledIcon: ScribbledSquareIcon,
    tooltip: 'Square',
    disabled: false,
  },
  {
    name: 'ellipse',
    generalIcon: EllipseIcon,
    scribbledIcon: ScribbledEllipseIcon,
    tooltip: 'Ellipse',
    disabled: false,
  },
  {
    name: 'diamond',
    generalIcon: DiamondIcon,
    scribbledIcon: ScribbledDiamondIcon,
    tooltip: 'Diamond',
    disabled: false,
  },
  {
    name: 'triangle',
    generalIcon: TriangleIcon,
    scribbledIcon: ScribbledTriangleIcon,
    tooltip: 'Triangle',
    disabled: false,
  },
  {
    name: 'roundedRect',
    generalIcon: RoundedRectangleIcon,
    scribbledIcon: ScribbledRoundedRectangleIcon,
    tooltip: 'Rounded rectangle',
    disabled: false,
  },
];

export const ShapeComponentConfigMap = ShapeComponentConfig.reduce(
  (acc, config) => {
    acc[config.name] = config;
    return acc;
  },
  {} as Record<Config['name'], Config>
);

export const SHAPE_SUBMENU_WIDTH = 464;
