/* eslint-disable @typescript-eslint/no-restricted-imports */
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import * as examples from '../data/index.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

const data = Object.entries(examples);

@customElement('example-list')
export class ExampleList extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      left: 1rem;
      top: 1rem;
    }

    .card {
      cursor: pointer;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
  }

  protected render() {
    return html`
      <div>
        ${repeat(
          data,
          item => item[0],
          ([name, fn]) => {
            return html`
              <sl-card
                class="card"
                @click=${() => {
                  fn(window.workspace);
                }}
              >
                ${name}
              </sl-card>
            `;
          }
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'example-list': ExampleList;
  }
}
