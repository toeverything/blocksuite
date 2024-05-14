import './components/bookmark-card.js';
import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import { BlockElement } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { Bound } from '../surface-block/utils/bound.js';
import { type BookmarkBlockModel } from './bookmark-model.js';
import type { BookmarkBlockService } from './bookmark-service.js';
import { refreshBookmarkUrlData } from './utils.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<
  BookmarkBlockModel,
  BookmarkBlockService
> {
  @property({ attribute: false })
  loading = false;

  @property({ attribute: false })
  error = false;

  @query('bookmark-card')
  bookmarkCard!: HTMLElement;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (!this._isInSurface) {
      return null;
    }
    return this.host.querySelector('affine-edgeless-root');
  }

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {
    refreshBookmarkUrlData(this).catch(console.error);
  };

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    const parent = this.host.doc.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    if (!this.model.description && !this.model.title) {
      this.refreshData();
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        if (key === 'url') {
          this.refreshData();
        }
      })
    );
  }

  override renderBlock() {
    const { style } = this.model;

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
      margin: '18px 0px',
    });
    if (this.isInSurface) {
      const width = EMBED_CARD_WIDTH[style];
      const height = EMBED_CARD_HEIGHT[style];
      const bound = Bound.deserialize(
        (this.edgeless?.service.getElementById(this.model.id) ?? this.model)
          .xywh
      );
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;
      containerStyleMap = styleMap({
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
      });
    }

    return html`
      <div class="affine-bookmark-container" style=${containerStyleMap}>
        <bookmark-card
          .bookmark=${this}
          .loading=${this.loading}
          .error=${this.error}
        ></bookmark-card>

        <embed-card-caption .block=${this}></embed-card-caption>

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>

      ${this.isInSurface ? nothing : Object.values(this.widgets)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
