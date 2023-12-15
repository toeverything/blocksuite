import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { AffineEditorContainer } from '@blocksuite/presets';
import { registerFramePanelComponents } from '@blocksuite/presets';
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
  @state()
  private _show = false;

  @property({ attribute: false })
  editor!: AffineEditorContainer;

  private _renderPanel() {
    return html`<frame-panel .editor=${this.editor}></frame-panel>`;
  }

  public toggleDisplay() {
    this._show = !this._show;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    registerFramePanelComponents(components => {
      Object.entries(components).forEach(([name, component]) => {
        customElements.define(name, component);
      });
    });

    this.disposables.add(
      this.editor.slots.pageModeSwitched.on(() => {
        this.editor.updateComplete.then(() => {
          this.requestUpdate();
        });
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
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-frame-panel': CustomFramePanel;
  }
}
