import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { HoverController } from '../_common/components/hover/controller.js';
import { AffineDragHandleWidget } from '../page-block/widgets/drag-handle/drag-handle.js';
import { captureEventTarget } from '../page-block/widgets/drag-handle/utils.js';
import type { BookmarkBlockComponent } from './bookmark-block.js';
import { BookmarkBlockSchema } from './bookmark-model.js';
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
    this._registerDragHandleOption();

    this.disposables.add(
      this.root.selection.slots.changed.on(() => this.requestUpdate())
    );
  }

  private _registerDragHandleOption = () => {
    this._disposables.add(
      AffineDragHandleWidget.registerOption({
        flavour: BookmarkBlockSchema.model.flavour,
        onDragStart: (state, startDragging) => {
          // Check if start dragging from the image block
          const target = captureEventTarget(state.raw.target);
          const docBookmarkBlock = target?.closest('affine-doc-bookmark');
          if (!docBookmarkBlock) return false;

          // If start dragging from the bookmark element
          // Set selection and take over dragStart event to start dragging
          this.root.selection.set([
            this.root.selection.getInstance('block', {
              path: docBookmarkBlock.block.path,
            }),
          ]);
          startDragging([docBookmarkBlock.block], state);
          return true;
        },
      })
    );
  };

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
        toggleBookmarkEditModal(this.block);
      }
      if (type === 'reload') {
        refreshBookmarkUrlData(this.block);
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
        .display=${!!this.model.caption && this.model.caption.length > 0}
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
