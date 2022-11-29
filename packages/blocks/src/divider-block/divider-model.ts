import { Space, BaseBlockModel, IBaseBlockProps } from '@blocksuite/store';

type DividerType = 'normal';
//TODO: add another type like https://jjuliano.github.io/markdown-ui/docs/divider.html

export interface DividerBlockProps extends IBaseBlockProps {
  flavour: 'affine:divider';
  type: DividerType;
}

export class DividerBlockModel
  extends BaseBlockModel
  implements DividerBlockProps
{
  flavour = 'affine:divider' as const;
  type: DividerType;

  constructor(space: Space, props: Partial<DividerBlockProps>) {
    super(space, props);
    this.type = props.type ?? 'normal';
  }

  override block2html(_previousSiblingId: string, _nextSiblingId: string) {
    switch (this.type) {
      case 'normal':
        return `<hr>`;
      default:
        return `<hr>`;
      ////TODO: add another type like https://jjuliano.github.io/markdown-ui/docs/divider.html
    }
  }
}
