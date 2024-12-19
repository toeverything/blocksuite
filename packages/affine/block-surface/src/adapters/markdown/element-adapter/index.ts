import type { MarkdownAST } from '@blocksuite/affine-shared/adapters';

import type { ElementModelToMarkdownAdapterMatcher } from './type.js';

import {
  ElementModelAdapter,
  type ElementModelAdapterContext,
} from '../../type.js';
import { elementToMarkdownAdapterMatchers } from './elements/index.js';

export class MarkdownElementModelAdapter extends ElementModelAdapter<
  MarkdownAST,
  MarkdownAST
> {
  constructor(
    readonly elementModelMatchers: ElementModelToMarkdownAdapterMatcher[] = elementToMarkdownAdapterMatchers
  ) {
    super();
  }

  fromElementModel(
    element: Record<string, unknown>,
    context: ElementModelAdapterContext<MarkdownAST>
  ) {
    const markdownAST: MarkdownAST | null = null;
    for (const matcher of this.elementModelMatchers) {
      if (matcher.match(element)) {
        return matcher.toAST(element, context);
      }
    }
    return markdownAST;
  }
}
