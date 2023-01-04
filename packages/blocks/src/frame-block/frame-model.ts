import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export interface FrameBlockProps extends IBaseBlockProps {
  flavour: 'affine:frame';
  /** packed field */
  xywh: string;
}

export class FrameBlockModel extends BaseBlockModel implements FrameBlockProps {
  static version = 1;
  flavour = 'affine:frame' as const;
  tag = literal`affine-frame`;

  xywh: string;

  constructor(page: Page, props: Partial<FrameBlockModel>) {
    super(page, props);
    this.xywh = props.xywh ?? '[0,0,720,480]';
  }
}
