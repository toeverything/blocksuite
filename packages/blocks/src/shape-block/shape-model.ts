import { BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export type ShapeColor = 'black';
export type ShapeType = 'rectangle';

export interface ShapeBlockProps extends IBaseBlockProps {
  flavor: 'affine:block';
  color: ShapeColor;
  type: ShapeType;

  // Refs: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  d: string;
  xywh: string;
}

export class ShapeBlockModel extends BaseBlockModel {}
