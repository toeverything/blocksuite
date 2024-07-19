import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import type { BookmarkBlockService } from './bookmark-service.js';

import { BlockComponent } from '../_common/components/block-component.js';
import { bindContainerHotkey } from '../_common/components/rich-text/keymap/container.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { Bound } from '../surface-block/utils/bound.js';
import './components/bookmark-card.js';
import { refreshBookmarkUrlData } from './utils.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockComponent<
  BookmarkBlockModel,
  BookmarkBlockService
> {
  private _fetchAbortController?: AbortController;

  private _isInSurface = false;

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {
    refreshBookmarkUrlData(this, this._fetchAbortController?.signal).catch(
      console.error
    );
  };

  override connectedCallback() {
    super.connectedCallback();

    bindContainerHotkey(this);

    this._fetchAbortController = new AbortController();

    this.contentEditable = 'false';

    const parent = this.host.doc.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    this.blockContainerStyles = this._isInSurface
      ? undefined
      : { margin: '18px 0' };

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

    if (this._isInSurface) {
      this.rootService &&
        this._disposables.add(
          this.rootService.layer.slots.layerUpdated.on(() => {
            this.requestUpdate();
          })
        );
      this.style.position = 'absolute';
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._fetchAbortController?.abort();
  }

  override renderBlock() {
    const { style } = this.model;

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
      minWidth: '450px',
    });

    if (this.isInSurface) {
      const width = EMBED_CARD_WIDTH[style];
      const height = EMBED_CARD_HEIGHT[style];
      const bound = Bound.deserialize(
        (this.rootService?.getElementById(this.model.id) ?? this.model).xywh
      );
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;

      containerStyleMap = styleMap({
        width: `100%`,
        height: `100%`,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
      });

      this.style.left = `${bound.x}px`;
      this.style.top = `${bound.y}px`;
      this.style.width = `${width}px`;
      this.style.height = `${height}px`;
      this.style.zIndex = `${this.toZIndex()}`;
    }

    return html`
      <div class="affine-bookmark-container" style=${containerStyleMap}>
        <bookmark-card
          .bookmark=${this}
          .loading=${this.loading}
          .error=${this.error}
        ></bookmark-card>
      </div>
    `;
  }

  toZIndex() {
    return this.rootService?.layer.getZIndex(this.model) ?? 1;
  }

  get isInSurface() {
    return this._isInSurface;
  }

  get rootService() {
    const edgelessService = this.host.spec.getService(
      'affine:page'
    ) as EdgelessRootService;

    if (!edgelessService.surface) {
      return null;
    }

    return edgelessService;
  }

  @query('bookmark-card')
  accessor bookmarkCard!: HTMLElement;

  @property({ attribute: false })
  accessor error = false;

  @property({ attribute: false })
  accessor loading = false;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
