import '../_common/components/embed-card/embed-card-caption.js';

import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { getEdgelessPageByElement } from '../_common/utils/query.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { BookmarkBlockComponent } from './bookmark-block.js';
import type { BookmarkBlockModel } from './bookmark-model.js';

@customElement('affine-edgeless-bookmark')
export class EdgelessBookmarkBlockComponent extends WithDisposable(
  ShadowlessElement
) {
  @property({ attribute: false })
  block!: BookmarkBlockComponent;

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

    this.disposables.add(
      this.model.page.slots.blockUpdated.on(({ id }) => {
        if (id === this.model.id) {
          this.requestUpdate();
        }
      })
    );
  }

  override render() {
    const style = this.model.style;
    const width = EMBED_CARD_WIDTH[style];
    const height = EMBED_CARD_HEIGHT[style];

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
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
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
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-bookmark': EdgelessBookmarkBlockComponent;
  }
}
