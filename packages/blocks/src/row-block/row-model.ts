import { BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class RowBlockModel extends BaseBlockModel {
  static version = 1;
  flavour = 'affine:row' as const;
  tag = literal`affine-row`;
}
