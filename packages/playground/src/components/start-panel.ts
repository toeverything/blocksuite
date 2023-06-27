/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/components/card/card.js';

import { tryMigrate } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import * as examples from '../data/index.js';

const initFunctions = Object.values(examples);

@customElement('start-panel')
export class StartPanel extends LitElement {
  static override styles = css`
    .container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      margin: 1rem;
      gap: 1rem;
    }

    .card {
      width: 300px;
      font-family: var(--sl-input-font-family);
      font-size: 14px;
      cursor: pointer;
    }
  `;

  override render() {
    return html`
      <div class="container">
        ${repeat(
          initFunctions,
          fn => html`
            <sl-card
              class="card"
              @click=${() => {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('init', fn.id);
                window.location.search = urlParams.toString();
              }}
            >
              <div slot="header">${fn.displayName}</div>
              ${fn.description}
            </sl-card>
          `
        )}
        <sl-card
          class="card"
          @click=${() => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', '.json');
            input.multiple = false;
            input.onchange = async () => {
              const file = input.files?.item(0);
              if (!file) {
                return;
              }
              try {
                const json = await file.text();
                await window.workspace.importPageSnapshot(
                  JSON.parse(json),
                  window.page.id
                );
                tryMigrate(window.workspace.doc);
                this.requestUpdate();
              } catch (e) {
                console.error('Invalid snapshot.');
                console.error(e);
              } finally {
                input.remove();
              }
            };
            input.click();
          }}
        >
          <div slot="header">Import YDoc</div>
          Import a YDoc from a binary file. It will run migration after import
          and we can use it to test migration.
        </sl-card>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'start-panel': StartPanel;
  }
}
