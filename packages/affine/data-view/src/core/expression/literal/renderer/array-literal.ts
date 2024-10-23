import { html } from 'lit';

import type { TArray } from '../../../logical/typesystem.js';

import { LiteralElement } from './literal-element.js';

export class ArrayLiteral extends LiteralElement<unknown[], TArray> {
  override render() {
    return html``;
  }
}
