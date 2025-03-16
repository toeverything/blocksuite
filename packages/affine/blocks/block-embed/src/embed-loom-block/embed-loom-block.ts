import { OpenIcon } from '@blocksuite/affine-components/icons';
import type { EmbedLoomModel, EmbedLoomStyles } from '@blocksuite/affine-model';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import { BlockSelection } from '@blocksuite/block-std';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { getEmbedCardIcons } from '../common/utils.js';
import { loomUrlRegex } from './embed-loom-model.js';
import type { EmbedLoomBlockService } from './embed-loom-service.js';
import { LoomIcon, styles } from './styles.js';
import { refreshEmbedLoomUrlData } from './utils.js';

export class EmbedLoomBlockComponent extends EmbedBlockComponent<
  EmbedLoomModel,
  EmbedLoomBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedLoomStyles)[number] = 'video';

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
    refreshEmbedLoomUrlData(this, this.fetchAbortController.signal).catch(
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
        const urlMatch = url.match(loomUrlRegex);
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
  }

  override renderBlock() {
    const { image, title = 'Loom', description, videoId } = this.model.props;

    const loading = this.loading;
    const theme = this.std.get(ThemeProvider).theme;
    const { LoadingIcon, EmbedCardBannerIcon } = getEmbedCardIcons(theme);
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
        <div
          class=${classMap({
            'affine-embed-loom-block': true,
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
          <div class="affine-embed-loom-video">
            ${videoId
              ? html`
                  <div class="affine-embed-loom-video-iframe-container">
                    <iframe
                      src=${`https://www.loom.com/embed/${videoId}?hide_title=true`}
                      frameborder="0"
                      allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      loading="lazy"
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

              <div class="affine-embed-loom-content-url-icon">${OpenIcon}</div>
            </div>
          </div>
        </div>
      `
    );
  }

  @state()
  protected accessor _showOverlay = true;

  @property({ attribute: false })
  accessor loading = false;
}
