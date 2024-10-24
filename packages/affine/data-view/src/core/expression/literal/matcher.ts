import type { PopupTarget } from '@blocksuite/affine-components/context-menu';
import type { ReadonlySignal } from '@preact/signals-core';

import type { TType } from '../../logical/typesystem.js';
import type { LiteralData } from './types.js';

import { Matcher } from '../../logical/matcher.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { literalMatchers } from './define.js';

export const renderLiteral = (
  type: TType,
  value: ReadonlySignal<unknown>,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  return renderUniLit(data.view, { value$: value, onChange, type });
};

export const popLiteralEdit = (
  target: PopupTarget,
  type: TType,
  value: ReadonlySignal<unknown>,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  data.popEdit(target, { value$: value, onChange, type: type });
};

export const literalMatcher = new Matcher<LiteralData>(literalMatchers);
