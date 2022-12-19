import { Page, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

type ListType = 'bulleted' | 'numbered' | 'todo';

export interface ListBlockProps extends IBaseBlockProps {
  flavour: 'affine:list';
  type: ListType;
  checked: boolean;
}

export class ListBlockModel extends BaseBlockModel implements ListBlockProps {
  static version = [1, 0] as [number, number];
  flavour = 'affine:list' as const;
  tag = literal`affine-list`;

  type: ListType;
  checked: boolean;

  constructor(page: Page, props: Partial<ListBlockProps>) {
    super(page, props);
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
    const previousSiblingBlock = this.page.getBlockById(previousSiblingId);
    const nextSiblingBlock = this.page.getBlockById(nextSiblingId);
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
