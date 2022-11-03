import { Space, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

type ListType = 'bulleted' | 'numbered' | 'todo';

export interface ListBlockProps extends IBaseBlockProps {
  flavour: 'affine:list';
  type: ListType;
  checked: boolean;
}

export class ListBlockModel extends BaseBlockModel implements ListBlockProps {
  flavour = 'affine:list' as const;
  type: ListType;
  checked: boolean;

  constructor(space: Space, props: Partial<ListBlockProps>) {
    super(space, props);
    this.type = props.type ?? 'bulleted';
    this.checked = props.checked ?? false;
  }

  override block2html(
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    let text = super.block2html(
      childText,
      _previousSiblingId,
      _nextSiblingId,
      begin,
      end
    );
    const previousSiblingBlock = this.space.getBlockById(_previousSiblingId);
    const nextSiblingBlock = this.space.getBlockById(_nextSiblingId);
    switch (this.type) {
      case 'bulleted':
        text = `<li>${text}</li>`;
        break;
      case 'numbered':
        text = `<li>${text}</li>`;
        break;
      case 'todo':
        text = `<li><input disabled type="checkbox" ${
          this.checked ? 'checked' : ''
        }>${text}</li>`;
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
}
