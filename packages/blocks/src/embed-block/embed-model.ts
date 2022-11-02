import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface EmbedBlockProps extends IBaseBlockProps {
  flavour: string;
  type: string;
  url: string;
  width: number;
  height: number;
  visitWidth: number;
  visitHeight: number;
}
export class ImageBlockModel extends BaseBlockModel implements EmbedBlockProps {
  public url: string;

  public width: number;
  public height: number;
  visitWidth: number;
  visitHeight: number;
  constructor(store: Store, props: Partial<EmbedBlockProps>) {
    super(store, props);
    this.url = props.url ?? '';
    this.width = props.width ?? 0;
    this.height = props.height ?? 0;
    this.visitWidth = props.visitWidth ?? 0;
    this.visitHeight = props.visitHeight ?? 0;
  
  }
}
