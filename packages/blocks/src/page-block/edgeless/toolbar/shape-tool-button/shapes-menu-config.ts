import {
  DiamondIcon,
  EllipseIcon,
  RoundedRectangleIcon,
  SquareIcon,
  TriangleIcon,
} from '@blocksuite/global/config';
import type { TemplateResult } from 'lit';

import type { ShapeMouseMode } from '../../../../__internal__/index.js';

export const ShapeComponentConfig: Array<{
  name: ShapeMouseMode['shape'];
  icon: TemplateResult<1>;
  tooltip: string;
  disabled: boolean;
}> = [
  {
    name: 'rect',
    icon: SquareIcon,
    tooltip: 'Square',
    disabled: false,
  },
  {
    // TODO update new shape value
    name: 'rect',
    icon: EllipseIcon,
    tooltip: 'Ellipse',
    disabled: true,
  },
  {
    // TODO update new shape value
    name: 'rect',
    icon: DiamondIcon,
    tooltip: 'Diamond',
    disabled: true,
  },
  {
    name: 'triangle',
    icon: TriangleIcon,
    tooltip: 'Triangle',
    disabled: false,
  },
  {
    // TODO update new shape value
    name: 'rect',
    icon: RoundedRectangleIcon,
    tooltip: 'Rounded rectangle',
    disabled: false,
  },
];
