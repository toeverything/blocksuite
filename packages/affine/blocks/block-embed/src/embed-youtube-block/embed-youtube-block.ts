import { OpenIcon } from '@blocksuite/affine-components/icons';
import type {
  EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from '@blocksuite/affine-model';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import { BlockSelection } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { getEmbedCardIcons } from '../common/utils.js';
import { youtubeUrlRegex } from './embed-youtube-model.js';
import type { EmbedYoutubeBlockService } from './embed-youtube-service.js';
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
    let link = this.model.props.url;
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
    const blockSelection = selectionManager.create(BlockSelection, {
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
    this._cardStyle = this.model.props.style;

    if (!this.model.props.videoId) {
      this.doc.withoutTransact(() => {
        const url = this.model.props.url;
        const urlMatch = url.match(youtubeUrlRegex);
        if (urlMatch) {
          const [, videoId] = urlMatch;
          this.doc.updateBlock(this.model, {
            videoId,
          });
        }
      });
    }

    if (!this.model.props.description && !this.model.props.title) {
      this.doc.withoutTransact(() => {
        this.refreshData();
      });
    }

    this.disposables.add(
      this.model.propsUpdated.subscribe(({ key }) => {
        this.requestUpdate();
        if (key === 'url') {
          this.refreshData();
        }
      })
    );

    // this is required to prevent iframe from capturing pointer events
    this.disposables.add(
      this.selected$.subscribe(selected => {
        this._showOverlay = this._isResizing || this._isDragging || !selected;
      })
    );
    // this is required to prevent iframe from capturing pointer events
    this.handleEvent('dragStart', () => {
      this._isDragging = true;
      this._showOverlay =
        this._isResizing || this._isDragging || !this.selected$.peek();
    });

    this.handleEvent('dragEnd', () => {
      this._isDragging = false;
      this._showOverlay =
        this._isResizing || this._isDragging || !this.selected$.peek();
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
    } = this.model.props;

    const loading = this.loading;
    const theme = this.std.get(ThemeProvider).theme;
    const { LoadingIcon, EmbedCardBannerIcon } = getEmbedCardIcons(theme);
    const titleIcon = loading ? LoadingIcon : YoutubeIcon;
    const titleText = loading ? 'Loading...' : title;
    const descriptionText = loading ? null : description;
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
            selected: this.selected$.value,
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
                      loading="lazy"
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
                      loading="lazy"
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

            ${loading
              ? html`<div
                  class="affine-embed-youtube-content-description"
                ></div>`
              : descriptionText
                ? html`<div class="affine-embed-youtube-content-description">
                    ${descriptionText}
                  </div>`
                : nothing}

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
  private accessor _showImage = false;

  @state()
  protected accessor _showOverlay = true;

  @property({ attribute: false })
  accessor loading = false;
}
