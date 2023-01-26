import type { Page } from '@blocksuite/store';
import { BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export class EmbedBlockModel
  extends BaseBlockModel
  implements BlockSuiteModelProps.EmbedBlockModel
{
  static version = 1;
  flavour = 'affine:embed' as const;
  tag = literal`affine-embed`;

  width: number;
  height: number;
  type: EmbedType;
  sourceId: string;
  caption: string;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.EmbedBlockModel>>
  ) {
    super(page, props);
    this.type = props.type ?? 'image';
    this.caption = props.caption ?? 'image';
    this.sourceId = props.sourceId ?? '';
    this.width = props.width ?? 0;
    this.height = props.height ?? 0;
  }
}
