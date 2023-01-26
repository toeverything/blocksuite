import type { Page } from '@blocksuite/store';
import { BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class ParagraphBlockModel
  extends BaseBlockModel
  implements BlockSuiteModelProps.ParagraphBlockModel
{
  static version = 1;
  flavour = 'affine:paragraph' as const;
  tag = literal`affine-paragraph`;

  type: ParagraphType = 'text';

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.ParagraphBlockModel>>
  ) {
    super(page, props);
    this.type = props.type ?? 'text';
  }
}
