import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

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
  flavour = 'affine:paragraph' as const;
  type: ParagraphType = 'text';

  constructor(page: Page, props: Partial<ParagraphBlockProps>) {
    super(page, props);
    this.type = props.type ?? 'text';
  }

  override block2html(
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const text = super.block2html(
      childText,
      previousSiblingId,
      nextSiblingId,
      begin,
      end
    );
    switch (this.type) {
      case 'text':
        return `<p>${text}</p>`;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `<${this.type}>${text}</${this.type}>`;
      case 'quote':
        return `<blockquote>${text}</blockquote>`;
      default:
        return text;
    }
  }
}
