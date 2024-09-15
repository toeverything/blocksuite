import type { EmbedLoomModel, EmbedLoomStyles } from '@blocksuite/affine-model';

import { OpenIcon } from '@blocksuite/affine-components/icons';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedLoomBlockService } from './embed-loom-service.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { getEmbedCardIcons } from '../common/utils.js';
import { loomUrlRegex } from './embed-loom-model.js';
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
    let link = this.model.url;
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
  }

  override renderBlock() {
    const { image, title = 'Loom', description, videoId, style } = this.model;

    this._cardStyle = style;

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
        <div
          class=${classMap({
            'affine-embed-loom-block': true,
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

              <div class="affine-embed-loom-content-url-icon">${OpenIcon}</div>
            </div>
          </div>
        </div>
      `
    );
  }

  @state()
  protected accessor _isSelected = false;

  @state()
  protected accessor _showOverlay = true;

  @property({ attribute: false })
  accessor loading = false;
}
