import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { TArray } from '../../logical/typesystem.js';
import { popLiteralEdit, renderLiteral } from './index.js';
import { LiteralElement } from './literal-element.js';

export class ArrayLiteral extends LiteralElement<unknown[], TArray> {
  private _add(e: Event) {
    popLiteralEdit(e.target as HTMLElement, this.type.ele, undefined, value => {
      const arr = [...(this.value ?? []), value];
      this.onChange(arr);
    });
  }

  override show() {
    const arr = Array.isArray(this.value) ? this.value : [];
    const type = this.type;
    return html`
      <div style="display: flex;align-items:center;">
        ${repeat(arr, (v, i) => {
          const t = type.ele;
          return html`<span>
            ${i !== 0 ? ',' : ''}
            ${renderLiteral(t, v, v => {
              this.onChange(
                arr.map((value, index) => (i !== index ? value : v))
              );
            })}
          </span>`;
        })}
        <div @click="${this._add}">+</div>
      </div>
    `;
  }
}
