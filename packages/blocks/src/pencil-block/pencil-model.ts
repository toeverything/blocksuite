import { BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export type PencilColor = 'black';

export interface PencilBlockProps extends IBaseBlockProps {
  flavor: 'affine:pencil';
  color: PencilColor;

  // Refs: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
  d: string;
  xywh: string;
}

export class PencilBlockModel extends BaseBlockModel {}
