import { html } from 'lit';

import type { TUnion } from '../../../logical/typesystem.js';

import { LiteralElement } from './literal-element.js';

export class TagLiteral extends LiteralElement<string, TUnion> {
  override render() {
    return html``;
  }
}
