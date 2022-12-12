import { BaseBlockModel, IBaseBlockProps, Page } from '@blocksuite/store';

export class CodeBlockModel extends BaseBlockModel implements IBaseBlockProps {
  flavour = 'affine:code-block' as const;

  constructor(page: Page, props: Partial<IBaseBlockProps>) {
    super(page, props);
  }

  // TODO block2html
}
