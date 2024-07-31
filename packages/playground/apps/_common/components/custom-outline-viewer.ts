import type { AffineEditorContainer } from '@blocksuite/presets';

import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

@customElement('custom-outline-viewer')
export class CustomOutlineViewer extends WithDisposable(LitElement) {
  private static _paddingRight = 22;

  static override styles = css`
    .outline-viewer-container {
      position: fixed;
      max-height: calc(100vh - 16px);
      padding-right: ${this._paddingRight}px;
    }
  `;

  private _renderViewer() {
    return html`<affine-outline-viewer
      .editor=${this.editor}
      .toggleOutlinePanel=${this.toggleOutlinePanel}
    ></affine-outline-viewer>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    const observer = new ResizeObserver(() => {
      if (!this.editor.host) return;

      const { offsetTop, offsetWidth, offsetLeft } = this.editor.host;

      this._containerPosition = {
        top: `${offsetTop}px`,
        right: `calc(100vw - ${offsetLeft + offsetWidth}px)`,
      };
    });
    observer.observe(document.documentElement);
    this.disposables.add(() => observer.disconnect());
  }

  override render() {
    if (!this._show || this.editor.mode === 'edgeless') return nothing;

    return html`<div
      class="outline-viewer-container"
      style=${styleMap(this._containerPosition)}
    >
      ${this._renderViewer()}
    </div>`;
  }

  toggleDisplay() {
    this._show = !this._show;
  }

  @state()
  private accessor _containerPosition: Readonly<StyleInfo> = {};

  @state()
  private accessor _show = false;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor toggleOutlinePanel: (() => void) | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-outline-viewer': CustomOutlineViewer;
  }
}
