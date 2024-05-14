import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import { assertExists } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import type { EmbedFigmaStyles } from './embed-figma-model.js';
import { type EmbedFigmaModel } from './embed-figma-model.js';
import type { EmbedFigmaBlockService } from './embed-figma-service.js';
import { FigmaIcon, styles } from './styles.js';

@customElement('affine-embed-figma-block')
export class EmbedFigmaBlockComponent extends EmbedBlockElement<
  EmbedFigmaModel,
  EmbedFigmaBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedFigmaStyles)[number] = 'figma';

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

  refreshData = () => {};

  override connectedCallback() {
    super.connectedCallback();

    if (!this.model.description && !this.model.title) {
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          title: 'Figma',
          description: this.model.url,
        });
      });
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
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
    const { title, description, style, url } = this.model;

    this._cardStyle = style;
    this._width = EMBED_CARD_WIDTH[this._cardStyle];
    this._height = EMBED_CARD_HEIGHT[this._cardStyle];

    const titleText = title ?? 'Figma';
    const descriptionText = description ?? url;

    return this.renderEmbed(
      () => html`
        <div>
          <div
            class=${classMap({
              'affine-embed-figma-block': true,
              selected: this._isSelected,
            })}
            @click=${this._handleClick}
            @dblclick=${this._handleDoubleClick}
          >
            <div class="affine-embed-figma">
              <div class="affine-embed-figma-iframe-container">
                <iframe
                  src=${`https://www.figma.com/embed?embed_host=blocksuite&url=${url}`}
                  allowfullscreen
                ></iframe>

                <div
                  class=${classMap({
                    'affine-embed-figma-iframe-overlay': true,
                    hide: !this._showOverlay,
                  })}
                ></div>
              </div>
            </div>
            <div class="affine-embed-figma-content">
              <div class="affine-embed-figma-content-header">
                <div class="affine-embed-figma-content-title-icon">
                  ${FigmaIcon}
                </div>

                <div class="affine-embed-figma-content-title-text">
                  ${titleText}
                </div>
              </div>

              <div class="affine-embed-figma-content-description">
                ${descriptionText}
              </div>

              <div class="affine-embed-figma-content-url" @click=${this.open}>
                <span>www.figma.com</span>

                <div class="affine-embed-figma-content-url-icon">
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
    'affine-embed-figma-block': EmbedFigmaBlockComponent;
  }
}
