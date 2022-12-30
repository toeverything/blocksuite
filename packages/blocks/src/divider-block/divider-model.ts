import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export interface DividerBlockProps extends IBaseBlockProps {
  flavour: 'affine:divider';
}

export class DividerBlockModel
  extends BaseBlockModel
  implements DividerBlockProps
{
  static version = 1 as number;
  flavour = 'affine:divider' as const;
  tag = literal`affine-divider`;

  constructor(page: Page, props: Partial<DividerBlockProps>) {
    super(page, props);
  }

  override block2html(_previousSiblingId: string, _nextSiblingId: string) {
    return `<hr/>`;
  }
}
