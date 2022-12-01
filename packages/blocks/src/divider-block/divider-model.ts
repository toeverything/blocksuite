import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface DividerBlockProps extends IBaseBlockProps {
  flavour: 'affine:divider';
  type: 'normal';
}

export class DividerBlockModel
  extends BaseBlockModel
  implements DividerBlockProps
{
  flavour = 'affine:divider' as const;
  type: 'normal';

  constructor(page: Page, props: Partial<DividerBlockProps>) {
    super(page, props);
    this.type = props.type ?? 'normal';
  }

  override block2html(_previousSiblingId: string, _nextSiblingId: string) {
    return `<hr>`;
  }
}
