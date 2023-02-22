import {
  assertExists,
  Page,
  SelectionRange,
  UserInfo,
} from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface SelectionRect {
  width: number;
  height: number;
  top: number;
  left: number;
}

@customElement('remote-selection')
export class RemoteSelection extends LitElement {
  static styles = css`
    :host {
      position: absolute;
    }
  `;

  @property()
  page: Page | null = null;

  private _selections: Array<{
    id: number;
    range: SelectionRange;
    user?: UserInfo;
  }> = [];

  protected firstUpdated() {
    assertExists(this.page);
    this.page.awarenessStore.signals.update.subscribe(
      msg => msg,
      msg => {
        if (!msg || !msg.state?.cursor) {
          return;
        }

        assertExists(this.page);
        const page = this.page;
        const { user, cursor } = msg.state;
        if (msg.type === 'update') {
          const index = this._selections.findIndex(
            selection => selection.id === msg.id
          );
          if (index === -1) {
            this._selections.push({
              id: msg.id,
              range: cursor[page.prefixedId],
              user,
            });
          } else {
            this._selections[index] = {
              id: msg.id,
              range: cursor[page.prefixedId],
              user,
            };
          }
        } else if (msg.type === 'add') {
          this._selections.push({
            id: msg.id,
            range: cursor[page.prefixedId],
            user,
          });
        } else if (msg.type === 'remove') {
          const index = this._selections.findIndex(
            selection => selection.id === msg.id
          );
          this._selections.splice(index, 1);
        }

        this.requestUpdate();
      }
    );
  }

  render() {
    if (!this.page) {
      return html``;
    }

    const rects: SelectionRect[] = [];
    for (const selection of this._selections) {
      const { range } = selection;
    }
    console.log(this._selections);
    return html`<div></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'remote-selection': RemoteSelection;
  }
}
