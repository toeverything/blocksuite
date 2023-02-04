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
    .container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      margin: 1rem;
      gap: 1rem;
    }

    .card {
      cursor: pointer;
      font-family: var(--sl-input-font-family);
      font-size: 14px;
      width: 300px;
    }
  `;

  protected render() {
    return html`
      <div class="container">
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
                <div slot="header">${fn.displayName}</div>
                ${fn.description}
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
