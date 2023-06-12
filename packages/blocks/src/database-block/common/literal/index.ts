import type { TemplateResult } from 'lit';
import { html } from 'lit';

import { Matcher } from '../../logical/matcher.js';
import type { TType } from '../../logical/typesystem.js';
import {
  tArray,
  tNumber,
  tString,
  tTag,
  tUnknown,
} from '../../logical/typesystem.js';
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
  type: string,
  component: AnyLiteralComponent
): LiteralData => {
  const name = `ast-${type}-literal`;
  customElements.define(name, component as never);
  const fn = new Function(
    'html',
    'type',
    'value',
    'onChange',
    `return html\`<${name} .type='\${type}' .value='\${value}' .onChange='\${onChange}'></${name}>\`;`
  );
  return {
    render: (...args) => fn(html, ...args),
    component: component,
  };
};
literalMatcher.register(
  tString.create(),
  createRenderFunction('string', StringLiteral)
);
literalMatcher.register(
  tNumber.create(),
  createRenderFunction('number', NumberLiteral)
);
literalMatcher.register(
  tArray(tUnknown.create()),
  createRenderFunction('array', ArrayLiteral)
);
literalMatcher.register(tTag.create(), createRenderFunction('tag', TagLiteral));
