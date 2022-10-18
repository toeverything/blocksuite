import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

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
  flavour: 'paragraph';
  type: ParagraphType;
}

export class ParagraphBlockModel
  extends BaseBlockModel
  implements ParagraphBlockProps
{
  flavour = 'paragraph' as const;
  type: ParagraphType = 'text';

  constructor(store: Store, props: Partial<ParagraphBlockProps>) {
    super(store, props);
    this.type = props.type ?? 'text';
  }

  override block2html(
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const text = super.block2html(
      childText,
      _previousSiblingId,
      _nextSiblingId,
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
