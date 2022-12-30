import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export interface GroupBlockProps extends IBaseBlockProps {
  flavour: 'affine:group';
  /** packed field */
  xywh: string;
}

export class GroupBlockModel extends BaseBlockModel implements GroupBlockProps {
  static version = 1;
  flavour = 'affine:group' as const;
  tag = literal`affine-group`;

  xywh: string;

  constructor(page: Page, props: Partial<GroupBlockModel>) {
    super(page, props);
    this.xywh = props.xywh ?? '[0,0,720,480]';
  }
}
