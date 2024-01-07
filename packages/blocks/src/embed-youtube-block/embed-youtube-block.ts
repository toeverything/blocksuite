import { assertExists } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

import { HoverController } from '../_common/components/hover/controller.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import { getLinkCardIcons } from '../_common/utils/url.js';
import {
  type EmbedYoutubeModel,
  youtubeUrlRegex,
} from './embed-youtube-model.js';
import type { EmbedYoutubeService } from './embed-youtube-service.js';
import {
  EmbedYoutubeHeight,
  EmbedYoutubeWidth,
  styles,
  YoutubeIcon,
} from './styles.js';
import { refreshEmbedYoutubeUrlData } from './utils.js';

@customElement('affine-embed-youtube-block')
export class EmbedYoutubeBlockComponent extends EmbedBlockElement<
  EmbedYoutubeModel,
  EmbedYoutubeService
> {
  static override styles = styles;

  @property({ attribute: false })
  loading = false;

  @query('.affine-embed-youtube-block')
  private _youtubeBlockEl!: HTMLDivElement;

  readonly slots = {
    loadingUpdated: new Slot(),
  };

  refreshUrlData = () => {
    refreshEmbedYoutubeUrlData(this).catch(console.error);
  };

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _openLink() {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  }

  private _handleClick() {
    if (!this.isInSurface) {
      this._selectBlock();
    }
  }

  private _handleDoubleClick(event: MouseEvent) {
    if (!this.isInSurface) {
      event.stopPropagation();
      this._openLink();
    }
  }

  override connectedCallback() {
    super.connectedCallback();

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
        this.refreshUrlData();
      });
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.requestUpdate();
        if (key === 'url') this.refreshUrlData();
      })
    );

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);
      this.disposables.add(
        surface.edgeless.slots.elementUpdated.on(({ id }) => {
          if (id === this.model.id) {
            this.requestUpdate();
          }
        })
      );
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('loading')) {
      this.slots.loadingUpdated.emit();
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
        <link-card-toolbar
          .model=${this.model}
          .block=${this}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.std}
        ></link-card-toolbar>
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
    } = this.model;

    const loading = this.loading;

    const cardClassMap = classMap({
      loading,
    });

    const { LoadingIcon, LinkCardBannerIcon } = getLinkCardIcons();

    const titleIcon = loading ? LoadingIcon : YoutubeIcon;

    const titleText = loading ? 'Loading...' : title;

    const descriptionText = loading ? '' : description;

    const bannerImage =
      !loading && image
        ? html`<object type="image/webp" data=${image}>
            ${LinkCardBannerIcon}
          </object>`
        : LinkCardBannerIcon;

    const creatorImageEl =
      !loading && creatorImage
        ? html`<object type="image/webp" data=${creatorImage}>
            ${LinkCardBannerIcon}
          </object>`
        : nothing;

    this._width = EmbedYoutubeWidth;
    this._height = EmbedYoutubeHeight;

    return this.renderEmbed(
      () => html`
        <div
          ${!this.isInSurface ? ref(this._whenHover.setReference) : null}
          class="affine-embed-youtube-block${cardClassMap}"
          @click=${this._handleClick}
          @dblclick=${this._handleDoubleClick}
        >
          <div class="affine-embed-youtube-video">
            ${videoId
              ? html`
                  <iframe
                    id="ytplayer"
                    type="text/html"
                    src=${`https://www.youtube.com/embed/${videoId}`}
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                  ></iframe>
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

            <div class="affine-embed-youtube-content-url">
              <span>www.youtube.com</span>

              <div
                class="affine-embed-youtube-content-url-icon"
                @click=${this._openLink}
              >
                ${OpenIcon}
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
