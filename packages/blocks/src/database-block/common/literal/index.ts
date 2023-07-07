/* eslint-disable lit/binding-positions,lit/no-invalid-html */
import type { TemplateResult } from 'lit';
import type { StaticValue } from 'lit/static-html.js';
import { html, literal } from 'lit/static-html.js';

import { tNumber, tString, tTag } from '../../logical/data-type.js';
import { Matcher } from '../../logical/matcher.js';
import type { TType } from '../../logical/typesystem.js';
import { tArray, tUnknown } from '../../logical/typesystem.js';
import { ArrayLiteral } from './array-literal.js';
import type { LiteralElement } from './literal-element.js';
import { NumberLiteral } from './number-literal.js';
import { StringLiteral } from './string-literal.js';
import { TagLiteral } from './tag-literal.js';

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
type AnyLiteralComponent = typeof LiteralElement<any>;
type LiteralData = {
  render: LiteralRenderer;
  component: AnyLiteralComponent;
};
export const literalMatcher = new Matcher<LiteralData>();
const createRenderFunction = (
  type: StaticValue,
  component: AnyLiteralComponent
): LiteralData => {
  customElements.define(type._$litStatic$, component as never);
  return {
    render: (type, value, onChange) => html`
      <${type} .type='${type}' .value='${value}' .onChange='${onChange}'></${type}>`,
    component: component,
  };
};
literalMatcher.register(
  tString.create(),
  createRenderFunction(literal`ast-string-literal`, StringLiteral)
);
literalMatcher.register(
  tNumber.create(),
  createRenderFunction(literal`ast-number-literal`, NumberLiteral)
);
literalMatcher.register(
  tArray(tUnknown.create()),
  createRenderFunction(literal`ast-array-literal`, ArrayLiteral)
);
literalMatcher.register(
  tTag.create(),
  createRenderFunction(literal`ast-tag-literal`, TagLiteral)
);
