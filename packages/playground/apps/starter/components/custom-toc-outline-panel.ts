import { WithDisposable } from '@blocksuite/lit';
import {
  type AffineEditorContainer,
  registerTOCPanelComponents,
} from '@blocksuite/presets';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('custom-navigation-panel')
export class CustomTOCOutlinePanel extends WithDisposable(LitElement) {
  static override styles = css`
    .custom-toc-outline-container {
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
    return html`<toc-panel
      .editor=${this.editor}
      .fitPadding=${[50, 360, 50, 50]}
    ></toc-panel>`;
  }

  public toggleDisplay() {
    this._show = !this._show;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    registerTOCPanelComponents(components => {
      Object.entries(components).forEach(([name, component]) => {
        customElements.define(name, component);
      });
    });
  }

  override render() {
    return html`
      ${this._show
        ? html`
            <div class="custom-toc-outline-container">
              ${this._renderPanel()}
            </div>
          `
        : null}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-toc-outline-panel': CustomTOCOutlinePanel;
  }
}
