import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface GroupBlockProps extends IBaseBlockProps {
  flavour: 'affine:group';
  /** packed field */
  xywh: string;
}

export class GroupBlockModel extends BaseBlockModel implements GroupBlockProps {
  flavour = 'affine:group' as const;
  xywh: string;

  constructor(store: Store, props: Partial<GroupBlockModel>) {
    super(store, props);
    this.xywh = props.xywh ?? '[0,0,720,480]';
  }
}
