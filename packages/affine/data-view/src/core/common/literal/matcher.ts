import type { TType } from '../../logical/typesystem.js';
import type { LiteralData } from './types.js';

import { Matcher } from '../../logical/matcher.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { literalMatchers } from './define.js';

export const renderLiteral = (
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  return renderUniLit(data.view, { value, onChange, type });
};

export const popLiteralEdit = (
  target: HTMLElement,
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  data.popEdit(target, { value, onChange, type });
};

export const literalMatcher = new Matcher<LiteralData>(literalMatchers);
