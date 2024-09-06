import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { TUnion } from '../../../logical/typesystem.js';

import { LiteralElement } from './literal-element.js';

@customElement('data-view-literal-union-string-view')
export class TagLiteral extends LiteralElement<string, TUnion> {
  override render() {
    return html``;
  }
}
