import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { type AffineEditorContainer } from '@blocksuite/presets';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('custom-chat-panel')
export class CustomChatPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .custom-chat-container {
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

  public toggleDisplay() {
    this._show = !this._show;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const { editor } = this;

    this.disposables.add(
      editor.host.spec
        .getService('affine:page')
        .slots.editorModeSwitch.on(() => {
          this.editor.updateComplete
            .then(() => this.requestUpdate())
            .catch(console.error);
        })
    );
  }

  override render() {
    return html`
      ${this._show
        ? html`<div class="custom-chat-container blocksuite-overlay">
            <chat-panel .editor=${this.editor}></chat-panel>
          </div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-chat-panel': CustomChatPanel;
  }
}
