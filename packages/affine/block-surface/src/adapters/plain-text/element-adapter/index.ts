import type { TextBuffer } from '@blocksuite/affine-shared/adapters';

import type { ElementModelToPlainTextAdapterMatcher } from './type.js';

import {
  ElementModelAdapter,
  type ElementModelAdapterContext,
} from '../../type.js';
import { elementModelToPlainTextAdapterMatchers } from './elements/index.js';

export class PlainTextElementModelAdapter extends ElementModelAdapter<
  string,
  TextBuffer
> {
  constructor(
    readonly elementModelMatchers: ElementModelToPlainTextAdapterMatcher[] = elementModelToPlainTextAdapterMatchers
  ) {
    super();
  }

  fromElementModel(
    element: Record<string, unknown>,
    context: ElementModelAdapterContext<TextBuffer>
  ) {
    for (const matcher of this.elementModelMatchers) {
      if (matcher.match(element)) {
        return matcher.toAST(element, context).content;
      }
    }
    return '';
  }
}
