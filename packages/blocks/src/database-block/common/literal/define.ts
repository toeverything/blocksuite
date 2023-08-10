/* eslint-disable lit/binding-positions,lit/no-invalid-html */

import { html, literal, type StaticValue } from 'lit/static-html.js';

import { tNumber, tString, tTag } from '../../logical/data-type.js';
import { tArray, tUnknown } from '../../logical/typesystem.js';
import type { AnyLiteralComponent, LiteralData } from './matcher.js';
import { literalMatcher } from './matcher.js';
import { ArrayLiteral } from './renderer/array-literal.js';
import { NumberLiteral } from './renderer/number-literal.js';
import { StringLiteral } from './renderer/string-literal.js';
import { TagLiteral } from './renderer/tag-literal.js';

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
