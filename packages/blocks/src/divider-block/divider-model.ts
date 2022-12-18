import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export interface DividerBlockProps extends IBaseBlockProps {
  flavour: 'affine:divider';
}

export class DividerBlockModel
  extends BaseBlockModel
  implements DividerBlockProps
{
  static version = [1, 0] as [number, number];
  flavour = 'affine:divider' as const;
  tag = literal`list-block`;

  constructor(page: Page, props: Partial<DividerBlockProps>) {
    super(page, props);
  }

  override block2html(_previousSiblingId: string, _nextSiblingId: string) {
    return `<hr/>`;
  }
}
