import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import { assertExists } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import type { EmbedLoomStyles } from './embed-loom-model.js';
import { type EmbedLoomModel, loomUrlRegex } from './embed-loom-model.js';
import type { EmbedLoomService } from './embed-loom-service.js';
import { LoomIcon, styles } from './styles.js';
import { refreshEmbedLoomUrlData } from './utils.js';

@customElement('affine-embed-loom-block')
export class EmbedLoomBlockComponent extends EmbedBlockElement<
  EmbedLoomModel,
  EmbedLoomService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedLoomStyles)[number] = 'video';

  @property({ attribute: false })
  loading = false;

  @state()
  private _isSelected = false;

  @state()
  private _showOverlay = true;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isDragging = false;

  private _isResizing = false;

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  private _handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    this.open();
  }

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {
    refreshEmbedLoomUrlData(this).catch(console.error);
  };

  override connectedCallback() {
    super.connectedCallback();

    if (!this.model.videoId) {
      this.doc.withoutTransact(() => {
        const url = this.model.url;
        const urlMatch = url.match(loomUrlRegex);
        if (urlMatch) {
          const [, videoId] = urlMatch;
          this.doc.updateBlock(this.model, {
            videoId,
          });
        }
      });
    }

    if (!this.model.description && !this.model.title) {
      this.doc.withoutTransact(() => {
        this.refreshData();
      });
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.requestUpdate();
        if (key === 'url') {
          this.refreshData();
        }
      })
    );

    // this is required to prevent iframe from capturing pointer events
    this.disposables.add(
      this.std.selection.slots.changed.on(() => {
        this._isSelected =
          !!this.selected?.is('block') || !!this.selected?.is('surface');

        this._showOverlay =
          this._isResizing || this._isDragging || !this._isSelected;
      })
    );
    // this is required to prevent iframe from capturing pointer events
    this.handleEvent('pointerMove', ctx => {
      this._isDragging = ctx.get('pointerState').dragging;
      this._showOverlay =
        this._isResizing || this._isDragging || !this._isSelected;
    });

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);
      this.disposables.add(
        this.model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );

      this.edgeless?.slots.elementResizeStart.on(() => {
        this._isResizing = true;
        this._showOverlay = true;
      });

      this.edgeless?.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
        this._showOverlay =
          this._isResizing || this._isDragging || !this._isSelected;
      });
    }
  }

  override renderBlock() {
    const { image, title = 'Loom', description, videoId, style } = this.model;

    this._cardStyle = style;
    this._width = EMBED_CARD_WIDTH[this._cardStyle];
    this._height = EMBED_CARD_HEIGHT[this._cardStyle];

    const loading = this.loading;
    const { LoadingIcon, EmbedCardBannerIcon } = getEmbedCardIcons();
    const titleIcon = loading ? LoadingIcon : LoomIcon;
    const titleText = loading ? 'Loading...' : title;
    const descriptionText = loading ? '' : description;
    const bannerImage =
      !loading && image
        ? html`<object type="image/webp" data=${image} draggable="false">
            ${EmbedCardBannerIcon}
          </object>`
        : EmbedCardBannerIcon;

    return this.renderEmbed(
      () => html`
        <div>
          <div
            class=${classMap({
              'affine-embed-loom-block': true,
              loading,
              selected: this._isSelected,
            })}
            @click=${this._handleClick}
            @dblclick=${this._handleDoubleClick}
          >
            <div class="affine-embed-loom-video">
              ${videoId
                ? html`
                    <div class="affine-embed-loom-video-iframe-container">
                      <iframe
                        src=${`https://www.loom.com/embed/${videoId}?hide_title=true`}
                        frameborder="0"
                        allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      ></iframe>

                      <div
                        class=${classMap({
                          'affine-embed-loom-video-iframe-overlay': true,
                          hide: !this._showOverlay,
                        })}
                      ></div>
                    </div>
                  `
                : bannerImage}
            </div>
            <div class="affine-embed-loom-content">
              <div class="affine-embed-loom-content-header">
                <div class="affine-embed-loom-content-title-icon">
                  ${titleIcon}
                </div>

                <div class="affine-embed-loom-content-title-text">
                  ${titleText}
                </div>
              </div>

              <div class="affine-embed-loom-content-description">
                ${descriptionText}
              </div>

              <div class="affine-embed-loom-content-url" @click=${this.open}>
                <span>loom.com</span>

                <div class="affine-embed-loom-content-url-icon">
                  ${OpenIcon}
                </div>
              </div>
            </div>
          </div>

          <embed-card-caption .block=${this}></embed-card-caption>

          <affine-block-selection .block=${this}></affine-block-selection>
        </div>

        ${this.isInSurface ? nothing : Object.values(this.widgets)}
      `
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-loom-block': EmbedLoomBlockComponent;
  }
}
