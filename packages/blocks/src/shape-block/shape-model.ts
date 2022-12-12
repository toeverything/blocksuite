import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';
import type { ShapeColor, ShapeType } from '../__internal__';

export interface ShapeBlockProps extends IBaseBlockProps {
  flavor: 'affine:shape';
  color: ShapeColor;
  type: ShapeType;

  xywh: string;
}

export class ShapeBlockModel extends BaseBlockModel {
  flavour = 'affine:shape' as const;

  color: ShapeColor;
  type: ShapeType;
  xywh: string;

  constructor(page: Page, props: Partial<ShapeBlockModel>) {
    super(page, props);
    this.xywh = props.xywh ?? '[0,0,100,100]';
    this.type = props.type ?? 'rectangle';
    this.color = props.color ?? 'black';
  }
}
