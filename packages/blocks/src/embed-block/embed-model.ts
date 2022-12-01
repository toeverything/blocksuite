import { BaseBlockModel, IBaseBlockProps, Space } from '@blocksuite/store';

type EmbedType = 'image' | 'video' | 'audio' | 'file';
export interface EmbedBlockProps extends IBaseBlockProps {
  flavour: string;
  type: EmbedType;
  source: string;
  width?: number;
  height?: number;
  caption?: string;
}

export class EmbedBlockModel extends BaseBlockModel implements EmbedBlockProps {
  flavour = 'affine:embed' as const;
  public width: number;
  public height: number;
  public type: EmbedType;
  public source: string;
  public caption: string;
  constructor(space: Space, props: Partial<EmbedBlockProps>) {
    super(space, props);
    this.type = props.type ?? 'image';
    this.caption = props.caption ?? 'image';
    this.source = props.source ?? '';
    this.width = props.width ?? 0;
    this.height = props.height ?? 0;
  }
}
