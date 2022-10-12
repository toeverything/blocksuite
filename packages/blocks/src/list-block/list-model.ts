import { Store, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

type ListType = 'bulleted' | 'numbered' | 'todo';

export interface ListBlockProps extends IBaseBlockProps {
  flavour: 'list';
  type: ListType;
  checked: boolean;
}

export class ListBlockModel extends BaseBlockModel implements ListBlockProps {
  flavour = 'list' as const;
  type: ListType;
  checked: boolean;

  constructor(store: Store, props: Partial<ListBlockProps>) {
    super(store, props);
    this.type = props.type ?? 'bulleted';
    this.checked = props.checked ?? false;
  }

  override block2html(childText: string, begin?: number, end?: number) {
    const text = super.block2html(childText, begin, end);
    // todo
    switch (this.type) {
      case 'bulleted':
        return `<ul><li>${text}</li></ul>`;
      case 'numbered':
        return `<ol><li>${text}</li></ol>`;
      case 'todo':
        return `<ul><li>[ ] ${text}</li></ul>`;
      default:
        return text;
    }
  }
}
