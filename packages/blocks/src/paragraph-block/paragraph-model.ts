import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

export type ParagraphType =
  | 'text'
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
  type: ParagraphType = 'text';

  constructor(store: Store, props: Partial<ParagraphBlockProps>) {
    super(store, props);
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
        return `<div>${text}<div>`;
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

  override block2markdown(
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const text = super.block2markdown(
      childText,
      previousSiblingId,
      nextSiblingId,
      begin,
      end
    );
    switch (this.type) {
      case 'h1':
        return '# ' + text;
      case 'h2':
        return '## ' + text;
      case 'h3':
        return '## ' + text;
      case 'h4':
        return '## ' + text;
      case 'h5':
        return '## ' + text;
      case 'h6':
        return '###### ' + text;
      case 'quote':
        return '> ' + text;
      default:
        return text;
    }
  }
}
