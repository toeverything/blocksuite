import type { Page } from '@blocksuite/store';
import { BaseBlockModel } from '@blocksuite/store';
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
}
