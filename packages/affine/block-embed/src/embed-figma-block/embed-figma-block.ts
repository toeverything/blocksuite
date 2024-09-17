import type {
  EmbedFigmaModel,
  EmbedFigmaStyles,
} from '@blocksuite/affine-model';

import { OpenIcon } from '@blocksuite/affine-components/icons';
import { html } from 'lit';
import { state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedFigmaBlockService } from './embed-figma-service.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { FigmaIcon, styles } from './styles.js';

export class EmbedFigmaBlockComponent extends EmbedBlockComponent<
  EmbedFigmaModel,
  EmbedFigmaBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedFigmaStyles)[number] = 'figma';

  protected _isDragging = false;

  protected _isResizing = false;

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {};

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
  }

  override renderBlock() {
    const { title, description, style, url } = this.model;

    this._cardStyle = style;

    const titleText = title ?? 'Figma';
    const descriptionText = description ?? url;

    return this.renderEmbed(
      () => html`
        <div
          class=${classMap({
            'affine-embed-figma-block': true,
            selected: this._isSelected,
          })}
          style=${styleMap({
            transform: `scale(${this._scale})`,
            transformOrigin: '0 0',
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

              <div class="affine-embed-figma-content-url-icon">${OpenIcon}</div>
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
}
