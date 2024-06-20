import { assertExists } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import type { EmbedYoutubeStyles } from './embed-youtube-model.js';
import {
  type EmbedYoutubeModel,
  youtubeUrlRegex,
} from './embed-youtube-model.js';
import type { EmbedYoutubeBlockService } from './embed-youtube-service.js';
import { styles, YoutubeIcon } from './styles.js';
import { refreshEmbedYoutubeUrlData } from './utils.js';

@customElement('affine-embed-youtube-block')
export class EmbedYoutubeBlockComponent extends EmbedBlockElement<
  EmbedYoutubeModel,
  EmbedYoutubeBlockService
> {
  static override styles = styles;

  @state()
  private accessor _isSelected = false;

  @state()
  private accessor _showOverlay = true;

  @state()
  private accessor _showImage = false;

  private _isDragging = false;

  private _isResizing = false;

  override _cardStyle: (typeof EmbedYoutubeStyles)[number] = 'video';

  @property({ attribute: false })
  accessor loading = false;

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
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
    refreshEmbedYoutubeUrlData(this, this.fetchAbortController.signal).catch(
      console.error
    );
  };

  override connectedCallback() {
    super.connectedCallback();

    if (!this.model.videoId) {
      this.doc.withoutTransact(() => {
        const url = this.model.url;
        const urlMatch = url.match(youtubeUrlRegex);
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

    matchMedia('print').addEventListener('change', () => {
      this._showImage = matchMedia('print').matches;
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
    const {
      image,
      title = 'YouTube',
      description,
      creator,
      creatorImage,
      videoId,
      style,
    } = this.model;

    this._cardStyle = style;
    this._width = EMBED_CARD_WIDTH[this._cardStyle];
    this._height = EMBED_CARD_HEIGHT[this._cardStyle];

    const loading = this.loading;
    const { LoadingIcon, EmbedCardBannerIcon } = getEmbedCardIcons();
    const titleIcon = loading ? LoadingIcon : YoutubeIcon;
    const titleText = loading ? 'Loading...' : title;
    const descriptionText = loading ? '' : description;
    const bannerImage =
      !loading && image
        ? html`<object type="image/webp" data=${image} draggable="false">
            ${EmbedCardBannerIcon}
          </object>`
        : EmbedCardBannerIcon;

    const creatorImageEl =
      !loading && creatorImage
        ? html`<object
            type="image/webp"
            data=${creatorImage}
            draggable="false"
          ></object>`
        : nothing;

    return this.renderEmbed(
      () => html`
        <div>
          <div
            class=${classMap({
              'affine-embed-youtube-block': true,
              loading,
              selected: this._isSelected,
            })}
            @click=${this._handleClick}
            @dblclick=${this._handleDoubleClick}
          >
            <div class="affine-embed-youtube-video">
              ${videoId
                ? html`
                    <div class="affine-embed-youtube-video-iframe-container">
                      <iframe
                        id="ytplayer"
                        type="text/html"
                        src=${`https://www.youtube.com/embed/${videoId}`}
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                      ></iframe>
                      <div
                        class=${classMap({
                          'affine-embed-youtube-video-iframe-overlay': true,
                          hide: !this._showOverlay,
                        })}
                      ></div>
                      <img
                        class=${classMap({
                          'affine-embed-youtube-video-iframe-overlay': true,
                          'media-print': true,
                          hide: !this._showImage,
                        })}
                        src=${`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                        alt="YouTube Video"
                      />
                    </div>
                  `
                : bannerImage}
            </div>
            <div class="affine-embed-youtube-content">
              <div class="affine-embed-youtube-content-header">
                <div class="affine-embed-youtube-content-title-icon">
                  ${titleIcon}
                </div>

                <div class="affine-embed-youtube-content-title-text">
                  ${titleText}
                </div>

                <div class="affine-embed-youtube-content-creator-image">
                  ${creatorImageEl}
                </div>

                <div class="affine-embed-youtube-content-creator-text">
                  ${creator}
                </div>
              </div>

              <div class="affine-embed-youtube-content-description">
                ${descriptionText}
              </div>

              <div class="affine-embed-youtube-content-url" @click=${this.open}>
                <span>www.youtube.com</span>

                <div class="affine-embed-youtube-content-url-icon">
                  ${OpenIcon}
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-youtube-block': EmbedYoutubeBlockComponent;
  }
}
