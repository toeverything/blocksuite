import { BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export type PencilColor = 'black';

export interface PencilBlockProps extends IBaseBlockProps {
  flavor: 'affine:pencil';
  color: PencilColor;
}

export class PencilBlockModel extends BaseBlockModel {}
