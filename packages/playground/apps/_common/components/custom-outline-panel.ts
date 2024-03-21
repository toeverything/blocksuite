import { WithDisposable } from '@blocksuite/block-std';
import {
  type AffineEditorContainer,
  registerOutlinePanelComponents,
} from '@blocksuite/presets';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('custom-outline-panel')
export class CustomOutlinePanel extends WithDisposable(LitElement) {
  static override styles = css`
    .custom-outline-container {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background: var(--affine-background-overlay-panel-color);
      height: 100vh;
      width: 320px;
      box-sizing: border-box;
      z-index: 1;
    }
  `;
  @state()
  private _show = false;

  @property({ attribute: false })
  editor!: AffineEditorContainer;

  private _renderPanel() {
    return html`<outline-panel
      .editor=${this.editor}
      .fitPadding=${[50, 360, 50, 50]}
    ></outline-panel>`;
  }

  public toggleDisplay() {
    this._show = !this._show;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    registerOutlinePanelComponents(components => {
      Object.entries(components).forEach(([name, component]) => {
        customElements.define(name, component);
      });
    });
  }

  override render() {
    return html`
      ${this._show
        ? html`
            <div class="custom-outline-container blocksuite-overlay">
              ${this._renderPanel()}
            </div>
          `
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-outline-panel': CustomOutlinePanel;
  }
}
