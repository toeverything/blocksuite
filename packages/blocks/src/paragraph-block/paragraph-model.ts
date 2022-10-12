import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export type ParagraphType =
  | 'paragraph'
  | 'quote'
  | 'text'
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
  type: ParagraphType = 'paragraph';

  constructor(store: Store, props: Partial<ParagraphBlockProps>) {
    super(store, props);
    this.type = props.type ?? 'paragraph';
  }

  override block2html(childText: string, begin?: number, end?: number) {
    const text = super.block2html(childText, begin, end);
    switch (this.type) {
      case 'text':
        return `<div>${text}<div>`;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `<${this.type}>${text}</${this.type}>`;
      // todo
      case 'quote':
        return `<div>${text}</div>`;
      default:
        return text;
    }
  }
}
