import { BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class SurfaceBlockModel extends BaseBlockModel {
  static version = 1;
  flavour = 'affine:surface' as const;
  tag = literal`affine-surface`;
}
