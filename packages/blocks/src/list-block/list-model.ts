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

  override block2html(
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    let text = super.block2html(
      childText,
      previousSiblingId,
      nextSiblingId,
      begin,
      end
    );
    const previousSiblingBlock = this.store.getBlockById(previousSiblingId);
    const nextSiblingBlock = this.store.getBlockById(nextSiblingId);
    switch (this.type) {
      case 'bulleted':
        text = `<li>${text}</li>`;
        break;
      case 'numbered':
        text = `<li>${text}</li>`;
        break;
      case 'todo':
        text = `<li>[ ] ${text}</li>`;
        break;
      default:
        break;
    }
    if (
      previousSiblingBlock?.flavour !== this.flavour ||
      previousSiblingBlock.type !== this.type
    ) {
      switch (this.type) {
        case 'bulleted':
        case 'todo':
          text = `<ul>${text}`;
          break;
        case 'numbered':
          text = `<ol>${text}`;
          break;
        default:
          break;
      }
    }
    if (
      nextSiblingBlock?.flavour !== this.flavour ||
      nextSiblingBlock.type !== this.type
    ) {
      switch (this.type) {
        case 'bulleted':
        case 'todo':
          text = `${text}</ul>`;
          break;
        case 'numbered':
          text = `${text}</ol>`;
          break;
        default:
          break;
      }
    }
    return text;
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
      case 'bulleted':
        return '* ' + text;
      case 'numbered':
        return '1. ' + text;
      case 'todo':
        return this.checked ? '* [x] ' : '* [] ' + text;
      default:
        return text;
    }
  }
}
