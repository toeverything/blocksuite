import { Page, BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class FrameBlockModel
  extends BaseBlockModel
  implements BlockSuiteProps.FrameBlockModel
{
  static version = 1;
  flavour = 'affine:frame' as const;
  tag = literal`affine-frame`;

  xywh: string;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteProps.FrameBlockModel>>
  ) {
    super(page, props);
    this.xywh = props.xywh ?? '[0,0,720,480]';
  }
}
