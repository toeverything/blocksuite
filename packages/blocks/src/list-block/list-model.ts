import { Page, BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class ListBlockModel
  extends BaseBlockModel
  implements BlockSuiteModelProps.ListBlockModel
{
  static version = 1;
  flavour = 'affine:list' as const;
  tag = literal`affine-list`;

  type: ListType;
  checked: boolean;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.ListBlockModel>>
  ) {
    super(page, props);
    this.type = props.type ?? 'bulleted';
    this.checked = props.checked ?? false;
  }
}
