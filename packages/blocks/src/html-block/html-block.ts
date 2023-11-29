import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { HoverController } from '../_common/components/index.js';
import { type HtmlBlockModel } from './html-model.js';
import { HtmlBlockOptionsTemplate } from './options.js';

@customElement('affine-html')
export class HtmlBlockComponent extends BlockElement<HtmlBlockModel> {
  static override styles = css`
    affine-html {
      display: block;
    }

    affine-html iframe {
      border: none;
      width: 100%;
    }
  `;

  private _hoverController = new HoverController(
    this,
    ({ abortController }) => ({
      template: HtmlBlockOptionsTemplate({
        anchor: this,
        model: this.model,
        abortController,
      }),
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    })
  );

  load = () => {
    this._hoverController;
    const iframe = this.querySelector('iframe');
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    iframe.style.height = `${doc.body.scrollHeight}px`;
  };

  override render() {
    if (!this.model.html) {
      return html` <div class="affine-html-empty">Empty</div>`;
    }
    return html` <iframe
      .onload="${this.load}"
      scrolling="false"
      .srcdoc="${this.model.html}"
    ></iframe>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-html': HtmlBlockComponent;
  }
}
