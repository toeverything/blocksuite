import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';

type EmbedType = 'image' | 'video' | 'audio' | 'file';
export interface EmbedBlockProps extends IBaseBlockProps {
  flavour: string;
  type: EmbedType;
  sourceId: string;
  width?: number;
  height?: number;
  caption?: string;
}

export class EmbedBlockModel extends BaseBlockModel implements EmbedBlockProps {
  flavour = 'affine:embed' as const;
  public width: number;
  public height: number;
  public type: EmbedType;
  public sourceId: string;
  public caption: string;
  constructor(page: Page, props: Partial<EmbedBlockProps>) {
    super(page, props);
    this.type = props.type ?? 'image';
    this.caption = props.caption ?? 'image';
    this.sourceId = props.sourceId ?? '';
    this.width = props.width ?? 0;
    this.height = props.height ?? 0;
  }
}
