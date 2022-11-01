import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export interface ImageBlockProps extends IBaseBlockProps {
  flavour: string;
  type: string;
  url: string;
  width: number;
  height: number;
  zoom?: number;
}
export class ImageBlockModel extends BaseBlockModel implements ImageBlockProps {
  public url: string;

  public width: number;
  public height: number;
  private _zoom: number;
  constructor(store: Store, props: Partial<ImageBlockProps>) {
    super(store, props);
    this.url = props.url ?? '';
    this.width = props.width ?? 0;
    this.height = props.height ?? 0;
    this._zoom = props.zoom ?? 1;
  }
}
