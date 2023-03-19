import {
  DiamondIcon,
  EllipseIcon,
  RoundedRectangleIcon,
  SquareIcon,
  TriangleIcon,
} from '@blocksuite/global/config';
import type { TemplateResult } from 'lit';

import type { ShapeMouseMode } from '../../../../__internal__/index.js';

type Config = {
  name: ShapeMouseMode['shape'];
  icon: TemplateResult<1>;
  tooltip: string;
  disabled: boolean;
};

export const ShapeComponentConfig: Config[] = [
  {
    name: 'rect',
    icon: SquareIcon,
    tooltip: 'Square',
    disabled: false,
  },
  {
    name: 'ellipse',
    icon: EllipseIcon,
    tooltip: 'Ellipse',
    disabled: false,
  },
  {
    name: 'diamond',
    icon: DiamondIcon,
    tooltip: 'Diamond',
    disabled: false,
  },
  {
    name: 'triangle',
    icon: TriangleIcon,
    tooltip: 'Triangle',
    disabled: false,
  },
  {
    name: 'roundedRect',
    icon: RoundedRectangleIcon,
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
