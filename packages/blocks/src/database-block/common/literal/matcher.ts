import type { TemplateResult } from 'lit';

import { Matcher } from '../../logical/matcher.js';
import type { TType } from '../../logical/typesystem.js';
import type { LiteralElement } from './renderer/literal-element.js';

export const renderLiteral = (
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  return data.render(type, value, onChange);
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
  const ele = data.component.create(type, value, onChange);
  ele._popEdit(target);
};

export type LiteralRenderer = (
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => TemplateResult;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyLiteralComponent = typeof LiteralElement<any>;
export type LiteralData = {
  render: LiteralRenderer;
  component: AnyLiteralComponent;
};
export const literalMatcher = new Matcher<LiteralData>();
