import { registerFramesSidebarComponents } from '@blocksuite/blocks';
import type { EditorContainer } from '@blocksuite/editor';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('custom-frames-panel')
export class CustomFramesPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .custom-frames-container {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background: var(--affine-background-overlay-panel-color);
      height: 100vh;
      width: 316px;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      padding-top: 12px;
      z-index: 1;
    }
  `;
  @state()
  private _show = false;

  @property({ attribute: false })
  editor!: EditorContainer;

  get edgeless() {
    return this.editor.querySelector('affine-edgeless-page');
  }

  private _renderPanel() {
    return html`<frames-panel .edgeless=${this.edgeless}></frames-panel>`;
  }

  public toggleDisplay() {
    this._show = !this._show;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    registerFramesSidebarComponents(components => {
      Object.entries(components).forEach(([name, component]) => {
        customElements.define(name, component);
      });
    });

    this.disposables.add(
      this.editor.slots.pageModeSwitched.on(() => this.requestUpdate())
    );
  }

  override render() {
    return html`
      ${this._show
        ? html`<div class="custom-frames-container">
            ${this._renderPanel()}
          </div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-frames-panel': CustomFramesPanel;
  }
}
