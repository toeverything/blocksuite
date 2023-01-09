import { Page, BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class ParagraphBlockModel
  extends BaseBlockModel
  implements BlockSuiteProps.ParagraphBlockModel
{
  static version = 1;
  flavour = 'affine:paragraph' as const;
  tag = literal`affine-paragraph`;

  type: ParagraphType = 'text';

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteProps.ParagraphBlockModel>>
  ) {
    super(page, props);
    this.type = props.type ?? 'text';
  }
}
