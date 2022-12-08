import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';
import type { ShapeColor, ShapeType } from '../__internal__';

export interface ShapeBlockProps extends IBaseBlockProps {
  flavor: 'affine:shape';
  color: ShapeColor;
  type: ShapeType;

  // Refs: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  d: string;
  xywh: string;
}

export class ShapeBlockModel extends BaseBlockModel {
  flavour = 'affine:shape' as const;

  constructor(page: Page, props: Partial<ShapeBlockModel>) {
    super(page, props);
  }
}
