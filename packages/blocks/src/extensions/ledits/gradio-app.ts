import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { createInlineIframe } from './utils.js';

@customElement('ledits-gradio-app')
export class GradioApp extends LitElement {
  static override styles = css`
    .gradio-app-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .gradio-app-footer {
      display: flex;
      justify-content: flex-end;
      gap: 2rem;
    }
  `;

  imageBlob!: Blob;

  private _loaded = false;
  private _iframe!: HTMLIFrameElement;

  override firstUpdated(): void {
    const iframe = this.renderRoot.querySelector('iframe');

    if (!iframe) return;

    iframe.src = createInlineIframe();
    iframe.onload = () => {
      this._setImage(iframe);
      iframe.onload = null;
    };
    this._iframe = iframe;
    this._loaded = true;
  }

  private _setImage = (iframe: HTMLIFrameElement) => {
    iframe.contentWindow?.postMessage(
      {
        type: 'set_image',
        image: this.imageBlob,
      },
      '*'
    );
  };

  exportImage(): Promise<Blob> {
    if (!this._iframe || !this._loaded || !this._iframe.contentWindow)
      return Promise.resolve(this.imageBlob);

    const iframeContentWindow = this._iframe.contentWindow;
    const p = new Promise<Blob>(resolve => {
      window.addEventListener(
        'message',
        e => {
          const blob = e.data?.blob;
          resolve(blob);
        },
        {
          once: true,
        }
      );

      iframeContentWindow.postMessage(
        {
          type: 'export_image',
        },
        '*'
      );
    });

    return p;
  }

  override render() {
    return html`<div class="gradio-app-wrapper">
      <iframe
        style="border: 0;width: 100%; height: 100%"
        sandbox="allow-forms allow-scripts allow-downloads"
        src="about:blank"
      ></iframe>
    </div>`;
  }
}
