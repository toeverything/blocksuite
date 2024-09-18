import type {
  EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from '@blocksuite/affine-model';

import { OpenIcon } from '@blocksuite/affine-components/icons';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedYoutubeBlockService } from './embed-youtube-service.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { getEmbedCardIcons } from '../common/utils.js';
import { youtubeUrlRegex } from './embed-youtube-model.js';
import { styles, YoutubeIcon } from './styles.js';
import { refreshEmbedYoutubeUrlData } from './utils.js';

export class EmbedYoutubeBlockComponent extends EmbedBlockComponent<
  EmbedYoutubeModel,
  EmbedYoutubeBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedYoutubeStyles)[number] = 'video';

  protected _isDragging = false;

  protected _isResizing = false;

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

  private _handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    this.open();
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  protected _handleClick(event: MouseEvent) {
    event.stopPropagation();
    this._selectBlock();
  }

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
    this.handleEvent('dragStart', () => {
      this._isDragging = true;
      this._showOverlay =
        this._isResizing || this._isDragging || !this._isSelected;
    });

    this.handleEvent('dragEnd', () => {
      this._isDragging = false;
      this._showOverlay =
        this._isResizing || this._isDragging || !this._isSelected;
    });

    matchMedia('print').addEventListener('change', () => {
      this._showImage = matchMedia('print').matches;
    });
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
        <div
          class=${classMap({
            'affine-embed-youtube-block': true,
            loading,
            selected: this._isSelected,
          })}
          style=${styleMap({
            transform: `scale(${this._scale})`,
            transformOrigin: '0 0',
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
      `
    );
  }

  @state()
  protected accessor _isSelected = false;

  @state()
  private accessor _showImage = false;

  @state()
  protected accessor _showOverlay = true;

  @property({ attribute: false })
  accessor loading = false;
}
