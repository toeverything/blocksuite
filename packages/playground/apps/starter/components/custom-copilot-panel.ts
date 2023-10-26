import type { EditorContainer } from '@blocksuite/editor';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('custom-copilot-panel')
export class CustomCopilotPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .custom-copilot-container {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background: var(--affine-background-overlay-panel-color);
      height: 100vh;
      width: 289px;
      box-sizing: border-box;
      overflow-y: scroll;
      overflow-x: visible;
      z-index: 1;
    }
  `;
  @state()
  private _show = false;

  @property({ attribute: false })
  editor!: EditorContainer;

  get page() {
    return this.editor.page;
  }

  public toggleDisplay() {
    this._show = !this._show;
  }

  override render() {
    return html`
      ${this._show
        ? html` <div class="custom-copilot-container"></div> `
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-copilot-panel': CustomCopilotPanel;
  }
}
