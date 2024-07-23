import type { AffineEditorContainer } from '@blocksuite/presets';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('custom-frame-panel')
export class CustomFramePanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .custom-frame-container {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background-color: var(--affine-background-primary-color);
      height: 100vh;
      width: 320px;
      box-sizing: border-box;
      padding-top: 16px;
      z-index: 1;
    }
  `;

  private _renderPanel() {
    return html`<affine-frame-panel
      .editor=${this.editor}
    ></affine-frame-panel>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.disposables.add(
      this.editor.slots.editorModeSwitched.on(() => {
        this.editor.updateComplete
          .then(() => this.requestUpdate())
          .catch(console.error);
      })
    );
  }

  override render() {
    return html`
      ${this._show
        ? html`<div class="custom-frame-container">${this._renderPanel()}</div>`
        : nothing}
    `;
  }

  toggleDisplay() {
    this._show = !this._show;
  }

  @state()
  private accessor _show = false;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-frame-panel': CustomFramePanel;
  }
}
