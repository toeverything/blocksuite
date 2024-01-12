import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../_common/components/hover/controller.js';
import type { BookmarkBlockComponent } from './bookmark-block.js';

@customElement('affine-doc-bookmark')
export class DocBookmarkBlockComponent extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  block!: BookmarkBlockComponent;

  @query('.affine-bookmark-card')
  bookmardCardElement!: HTMLElement;

  get model() {
    return this.block.model;
  }

  get host() {
    return this.block.host;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      this.host.selection.slots.changed.on(() => this.requestUpdate())
    );
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    return {
      template: html`
        <style>
          :host {
            z-index: 1;
          }
        </style>
        <embed-card-toolbar
          .model=${this.model}
          .block=${this.block}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.block.std}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this.bookmardCardElement,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override render() {
    return html`
      <div
        ${ref(this._whenHover.setReference)}
        style=${styleMap({
          width: '100%',
          margin: '18px 0',
          position: 'relative',
        })}
      >
        <bookmark-card .bookmark=${this.block}></bookmark-card>
        <embed-card-caption
          .block=${this.block}
          .display=${this.block.showCaption}
          @blur=${() => {
            if (!this.model.caption) this.block.showCaption = false;
          }}
        ></embed-card-caption>
        ${this.block.selected?.is('block')
          ? html`<affine-block-selection></affine-block-selection>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-doc-bookmark': DocBookmarkBlockComponent;
  }
}
