import type { ElementModelMap } from '../../../element-model/index.js';
import type { ElementModelToPlainTextAdapterMatcher } from './elements/type.js';

import { ElementModelAdapter } from '../../type.js';
import { elementModelToPlainTextAdapterMatchers } from './elements/index.js';

export class PlainTextElementModelAdapter extends ElementModelAdapter<string> {
  constructor(
    readonly elementModelMatchers: ElementModelToPlainTextAdapterMatcher[] = elementModelToPlainTextAdapterMatchers
  ) {
    super();
  }

  fromElementModel(elementModel: ElementModelMap[keyof ElementModelMap]) {
    for (const matcher of this.elementModelMatchers) {
      if (matcher.match(elementModel)) {
        return matcher.toAST(elementModel).content;
      }
    }
    return '';
  }
}
