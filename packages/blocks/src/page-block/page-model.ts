import { BaseBlockModel, Page } from '@blocksuite/store';

export class PageBlockModel
  extends BaseBlockModel
  implements BlockSuiteModelProps.PageBlockModel
{
  static version = 1;
  flavour = 'affine:page' as const;

  title = '';
  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.PageBlockModel>>
  ) {
    super(page, props);
    this.title = props.title ?? '';
  }
}
