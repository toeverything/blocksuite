import './components/index.js';
import '../_common/components/button.js';

import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import { HoverController } from '../_common/components/index.js';
import { AffineDragHandleWidget } from '../_common/widgets/drag-handle/index.js';
import { captureEventTarget } from '../_common/widgets/drag-handle/utils.js';
import {
  type BookmarkBlockModel,
  BookmarkBlockSchema,
} from './bookmark-model.js';
import type { BookmarkCaption } from './components/bookmark-caption.js';
import type {
  MenuActionCallback,
  ToolbarActionCallback,
} from './components/config.js';
import { toggleBookmarkEditModal } from './components/modal/bookmark-edit-modal.js';
import { refreshBookmarkUrlData } from './utils.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<BookmarkBlockModel> {
  @query('bookmark-caption')
  captionElement!: BookmarkCaption;

  @property({ attribute: false })
  loading = false;

  private _optionsAbortController?: AbortController;
  private _onToolbarSelected: ToolbarActionCallback & MenuActionCallback =
    type => {
      if (type === 'caption') {
        this.captionElement.display = true;
        this.captionElement.updateComplete.then(() => {
          this.captionElement.input.focus();
        });
      }
      if (type === 'edit') {
        toggleBookmarkEditModal(this);
      }
      if (type === 'reload') {
        refreshBookmarkUrlData(this);
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
          .root=${this}
          .abortController=${abortController}
          .std=${this.std}
        ></bookmark-toolbar>`,
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  private _registerDragHandleOption = () => {
    this._disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: BookmarkBlockSchema.model.flavour,
        onDragStart: (state, startDragging) => {
          // Check if start dragging from the image block
          const target = captureEventTarget(state.raw.target);
          const bookmarkBlock = target?.closest('affine-bookmark');
          if (!bookmarkBlock) return false;

          // If start dragging from the bookmark element
          // Set selection and take over dragStart event to start dragging
          this.root.selection.set([
            this.root.selection.getInstance('block', {
              path: bookmarkBlock.path,
            }),
          ]);
          startDragging([bookmarkBlock], state);
          return true;
        },
      })
    );
  };

  override connectedCallback() {
    super.connectedCallback();
    refreshBookmarkUrlData(this);
    this._registerDragHandleOption();
  }

  override render() {
    return html`
      <div
        ${ref(this._whenHover.setReference)}
        class="affine-bookmark-block-container"
      >
        ${this.loading
          ? html`<bookmark-loading></bookmark-loading>`
          : html`<bookmark-card .bookmark=${this}></bookmark-card>`}
        <bookmark-caption
          .bookmark=${this}
          .display=${this.model.caption && this.model.caption.length > 0}
        ></bookmark-caption>
        ${this.selected?.is('block')
          ? html`<affine-block-selection></affine-block-selection>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
