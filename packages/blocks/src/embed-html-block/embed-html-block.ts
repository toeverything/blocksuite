import { css, html, type PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import type { EmbedHtmlBlockModel } from './embed-html-model.js';

@customElement('affine-embed-html-block')
export class EmbedHtmlBlock extends EmbedBlockElement<EmbedHtmlBlockModel> {
  static override styles = css`
    //affine-html {
    //  display: block;
    //}
    //
    .embed-html-block-iframe {
      border: none;
      width: 100%;
    }
  `;
  @query('.embed-html-block-iframe')
  iframe!: HTMLIFrameElement;

  updateWH = () => {
    const [, , w, h] = JSON.parse(this.model.xywh);
    this.iframe.style.width = `${w}px`;
    this.iframe.style.height = `${h}px`;
  };

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(this.model.propsUpdated.on(this.updateWH));
  }

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this.updateWH();
  }

  load = () => {
    const iframe = this.querySelector('iframe');
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    iframe.style.height = `${doc.body.scrollHeight}px`;
  };
  override render(): unknown {
    return this.renderEmbed(() => {
      if (!this.model.html) {
        return html` <div class="affine-html-empty">Empty</div>`;
      }
      return html`<iframe
        class="embed-html-block-iframe"
        .onload="${this.load}"
        scrolling="false"
        .srcdoc="${this.model.html}"
      ></iframe>`;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-html-block': EmbedHtmlBlock;
  }
}
