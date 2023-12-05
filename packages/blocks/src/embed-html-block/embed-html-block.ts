import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import type { EmbedHtmlBlockModel } from './embed-html-model.js';

@customElement('affine-embed-html-block')
export class EmbedHtmlBlock extends EmbedBlockElement<EmbedHtmlBlockModel> {
  static override styles = css`
    //affine-html {
    //  display: block;
    //}
    //
    //affine-html iframe {
    //  border: none;
    //  width: 100%;
    //}
  `;
  load = () => {
    const iframe = this.querySelector('iframe');
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    iframe.style.height = `${doc.body.scrollHeight}px`;
  };
  override render(): unknown {
    return this.renderEmbed(() => {
      return html`<div
        style="width: 100px;height: 100px;background-color: red"
      ></div>`;
      if (!this.model.html) {
        return html` <div class="affine-html-empty">Empty</div>`;
      }
      return html` <iframe
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
