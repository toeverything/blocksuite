import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export type ParagraphType =
  | 'text'
  | 'quote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

export interface ParagraphBlockProps extends IBaseBlockProps {
  flavour: 'affine:paragraph';
  type: ParagraphType;
}

export class ParagraphBlockModel
  extends BaseBlockModel
  implements ParagraphBlockProps
{
  static version = 1 as number;
  flavour = 'affine:paragraph' as const;
  tag = literal`affine-paragraph`;

  type: ParagraphType = 'text';

  constructor(page: Page, props: Partial<ParagraphBlockProps>) {
    super(page, props);
    this.type = props.type ?? 'text';
  }
}
