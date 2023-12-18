import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../_common/components/hover/controller.js';
import type { BookmarkBlockComponent } from './bookmark-block.js';
import type { BookmarkCaption } from './components/bookmark-caption.js';
import type {
  MenuActionCallback,
  ToolbarActionCallback,
} from './components/config.js';
import { toggleBookmarkEditModal } from './components/modal/bookmark-edit-modal.js';
import { refreshBookmarkUrlData } from './utils.js';

@customElement('affine-doc-bookmark')
export class DocBookmarkBlockComponent extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  block!: BookmarkBlockComponent;

  @state()
  private _showCaption = false;

  @query('bookmark-caption')
  captionElement!: BookmarkCaption;

  get model() {
    return this.block.model;
  }

  get root() {
    return this.block.host;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!!this.model.caption && this.model.caption.length > 0) {
      this._showCaption = true;
    }

    this.disposables.add(
      this.root.selection.slots.changed.on(() => this.requestUpdate())
    );
  }

  private _optionsAbortController?: AbortController;
  private _onToolbarSelected: ToolbarActionCallback & MenuActionCallback =
    type => {
      if (type === 'caption') {
        this._showCaption = true;
        this.updateComplete
          .then(() => this.captionElement.input.focus())
          .catch(console.error);
      }
      if (type === 'edit') {
        toggleBookmarkEditModal(this.block);
      }
      if (type === 'reload') {
        refreshBookmarkUrlData(this.block).catch(console.error);
      }
      this._optionsAbortController?.abort();
    };
  private _whenHover = new HoverController(this, ({ abortController }) => {
    this._optionsAbortController = abortController;
    return {
      template: html`<style>
          :host {
            z-index: 1;
          }
        </style>
        <bookmark-toolbar
          .model=${this.model}
          .onSelected=${this._onToolbarSelected}
          .host=${this}
          .abortController=${abortController}
          .std=${this.block.std}
        ></bookmark-toolbar>`,
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override render() {
    return html`<div
      ${ref(this._whenHover.setReference)}
      style=${styleMap({
        width: '100%',
        margin: '18px 0',
        position: 'relative',
      })}
    >
      <bookmark-card .bookmark=${this.block}></bookmark-card>
      <bookmark-caption
        .bookmark=${this.block}
        .display=${this._showCaption}
        @blur=${() => {
          if (!this.model.caption) {
            this._showCaption = false;
          }
        }}
      ></bookmark-caption>
      ${this.block.selected?.is('block')
        ? html`<affine-block-selection></affine-block-selection>`
        : null}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-doc-bookmark': DocBookmarkBlockComponent;
  }
}
