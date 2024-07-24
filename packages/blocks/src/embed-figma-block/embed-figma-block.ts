import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedFigmaStyles } from './embed-figma-model.js';
import type { EmbedFigmaModel } from './embed-figma-model.js';
import type { EmbedFigmaBlockService } from './embed-figma-service.js';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockComponent } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import { FigmaIcon, styles } from './styles.js';

@customElement('affine-embed-figma-block')
export class EmbedFigmaBlockComponent extends EmbedBlockComponent<
  EmbedFigmaModel,
  EmbedFigmaBlockService
> {
  override _cardStyle: (typeof EmbedFigmaStyles)[number] = 'figma';

  private _isDragging = false;

  private _isResizing = false;

  static override styles = styles;

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {};

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

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

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

    if (this.isInSurface) {
      this.disposables.add(
        this.model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );

      this.rootService?.slots.elementResizeStart.on(() => {
        this._isResizing = true;
        this._showOverlay = true;
      });

      this.rootService?.slots.elementResizeEnd.on(() => {
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
        </div>
      `
    );
  }

  @state()
  private accessor _isSelected = false;

  @state()
  private accessor _showOverlay = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-figma-block': EmbedFigmaBlockComponent;
  }
}
