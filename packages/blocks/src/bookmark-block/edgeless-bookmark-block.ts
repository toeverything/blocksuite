import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getEdgelessPageByElement } from '../_common/utils/query.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { BookmarkBlockComponent } from './bookmark-block.js';
import type {
  BookmarkBlockModel,
  BookmarkBlockType,
} from './bookmark-model.js';

export const EdgelessBookmarkWidth: Record<BookmarkBlockType, number> = {
  horizontal: 752,
  list: 752,
  vertical: 364,
  cube: 170,
};

export const EdgelessBookmarkHeight: Record<BookmarkBlockType, number> = {
  horizontal: 114,
  list: 46,
  vertical: 390,
  cube: 114,
};

@customElement('affine-edgeless-bookmark')
export class EdgelessBookmarkBlockComponent extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  block!: BookmarkBlockComponent;

  @state()
  private _showCaption = false;

  get model() {
    return this.block.model;
  }

  get edgeless() {
    const edgeless = getEdgelessPageByElement(this);
    assertExists(edgeless);
    return edgeless;
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!!this.model.caption && this.model.caption.length > 0) {
      this._showCaption = true;
    }

    this.disposables.add(
      this.edgeless.slots.elementUpdated.on(({ id }) => {
        if (id === this.model.id) {
          this.requestUpdate();
        }
      })
    );
  }

  override render() {
    const style = this.model.style;
    const width = EdgelessBookmarkWidth[style];
    const height = EdgelessBookmarkHeight[style];

    const bound = Bound.deserialize(
      (
        (this.edgeless.service.getElementById(
          this.model.id
        ) as BookmarkBlockModel) ?? this.model
      ).xywh
    );
    const scaleX = bound.w / width;
    const scaleY = bound.h / height;

    return html`<div
      style=${styleMap({
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
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
    'affine-edgeless-bookmark': EdgelessBookmarkBlockComponent;
  }
}
