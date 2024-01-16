import '../_common/components/embed-card/embed-card-caption.js';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/controller.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import { getEmbedCardIcons } from '../_common/utils/url.js';
import type { EmbedYoutubeStyles } from './embed-youtube-model.js';
import {
  type EmbedYoutubeModel,
  youtubeUrlRegex,
} from './embed-youtube-model.js';
import type { EmbedYoutubeService } from './embed-youtube-service.js';
import { styles, YoutubeIcon } from './styles.js';
import { refreshEmbedYoutubeUrlData } from './utils.js';

@customElement('affine-embed-youtube-block')
export class EmbedYoutubeBlockComponent extends EmbedBlockElement<
  EmbedYoutubeModel,
  EmbedYoutubeService
> {
  static override styles = styles;

  override cardStyle: (typeof EmbedYoutubeStyles)[number] = 'video';

  @property({ attribute: false })
  loading = false;

  @state()
  private _showOverlay = true;

  @state()
  showCaption = false;

  @query('.affine-embed-youtube-block')
  private _youtubeBlockEl!: HTMLDivElement;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isDragging = false;

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {
    refreshEmbedYoutubeUrlData(this).catch(console.error);
  };

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick() {
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!!this.model.caption && !!this.model.caption.length) {
      this.showCaption = true;
    }

    if (!this.model.videoId) {
      this.page.withoutTransact(() => {
        const url = this.model.url;
        const urlMatch = url.match(youtubeUrlRegex);
        if (urlMatch) {
          const [, videoId] = urlMatch;
          this.page.updateBlock(this.model, {
            videoId,
          });
        }
      });
    }

    if (!this.model.description && !this.model.title) {
      this.page.withoutTransact(() => {
        this.refreshData();
      });
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.requestUpdate();
        if (key === 'url') this.refreshData();
      })
    );

    // this is required to prevent iframe from capturing pointer events
    this.disposables.add(
      this.std.selection.slots.changed.on(sels => {
        if (this._isDragging) return;
        this._showOverlay = !sels.some(sel =>
          PathFinder.equals(sel.path, this.path)
        );
      })
    );
    // this is required to prevent iframe from capturing pointer events
    this.handleEvent('pointerMove', ctx => {
      this._isDragging = ctx.get('pointerState').dragging;
      if (this._isDragging) this._showOverlay = true;
    });

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);
      this.disposables.add(
        this.model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );
    }
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    return {
      template: html`
        <style>
          :host {
            z-index: 1;
          }
        </style>
        <embed-card-toolbar
          .model=${this.model}
          .block=${this}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.std}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this._youtubeBlockEl,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override render() {
    const {
      image,
      title = 'YouTube',
      description,
      creator,
      creatorImage,
      videoId,
      style,
    } = this.model;

    this.cardStyle = style;
    this._width = EMBED_CARD_WIDTH[this.cardStyle];
    this._height = EMBED_CARD_HEIGHT[this.cardStyle];

    const loading = this.loading;
    const { LoadingIcon, EmbedCardBannerIcon } = getEmbedCardIcons();
    const titleIcon = loading ? LoadingIcon : YoutubeIcon;
    const titleText = loading ? 'Loading...' : title;
    const descriptionText = loading ? '' : description;
    const bannerImage =
      !loading && image
        ? html`<object type="image/webp" data=${image}>
            ${EmbedCardBannerIcon}
          </object>`
        : EmbedCardBannerIcon;

    const creatorImageEl =
      !loading && creatorImage
        ? html`<object type="image/webp" data=${creatorImage}>
            ${EmbedCardBannerIcon}
          </object>`
        : nothing;

    return this.renderEmbed(
      () => html`
        <div
          style=${styleMap({
            position: 'relative',
          })}
        >
          <div
            ${this.isInSurface ? nothing : ref(this._whenHover.setReference)}
            class=${classMap({
              'affine-embed-youtube-block': true,
              loading,
            })}
            @click=${this._handleClick}
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

          <embed-card-caption
            .block=${this}
            .display=${this.showCaption}
            @blur=${() => {
              if (!this.model.caption) this.showCaption = false;
            }}
          ></embed-card-caption>

          ${this.selected?.is('block')
            ? html`<affine-block-selection></affine-block-selection>`
            : nothing}
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
