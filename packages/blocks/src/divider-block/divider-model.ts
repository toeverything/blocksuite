import { Page, BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class DividerBlockModel
  extends BaseBlockModel
  implements BlockSuiteModelProps.DividerBlockModel
{
  static version = 1;
  flavour = 'affine:divider' as const;
  tag = literal`affine-divider`;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.DividerBlockModel>>
  ) {
    super(page, props);
  }

  override block2html(_previousSiblingId: string, _nextSiblingId: string) {
    return `<hr/>`;
  }
}
