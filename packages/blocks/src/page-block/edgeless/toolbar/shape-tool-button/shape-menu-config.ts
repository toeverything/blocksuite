import {
  DiamondIcon,
  EllipseIcon,
  RoundedRectangleIcon,
  SquareIcon,
  TriangleIcon,
} from '@blocksuite/global/config';
import type { TemplateResult } from 'lit';

import type { ShapeMouseMode } from '../../../../__internal__/index.js';

export const ShapeComponentConfig: {
  name: ShapeMouseMode['shape'];
  icon: TemplateResult<1>;
  tooltips: string;
  disabled: boolean;
}[] = [
  {
    name: 'rect',
    icon: SquareIcon,
    tooltips: 'Square',
    disabled: false,
  },
  {
    // TODO update new shape value
    name: 'rect',
    icon: EllipseIcon,
    tooltips: 'Ellipse',
    disabled: true,
  },
  {
    // TODO update new shape value
    name: 'rect',
    icon: DiamondIcon,
    tooltips: 'Diamond',
    disabled: true,
  },
  {
    name: 'triangle',
    icon: TriangleIcon,
    tooltips: 'Triangle',
    disabled: true,
  },
  {
    // TODO update new shape value
    name: 'rect',
    icon: RoundedRectangleIcon,
    tooltips: 'Rounded rectangle',
    disabled: true,
  },
];
