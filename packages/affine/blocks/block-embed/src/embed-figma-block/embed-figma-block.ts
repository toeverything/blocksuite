import { OpenIcon } from '@blocksuite/affine-components/icons';
import type {
  EmbedFigmaModel,
  EmbedFigmaStyles,
} from '@blocksuite/affine-model';
import { BlockSelection } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { FigmaIcon, styles } from './styles.js';

export class EmbedFigmaBlockComponent extends EmbedBlockComponent<EmbedFigmaModel> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedFigmaStyles)[number] = 'figma';

  protected _isDragging = false;

  protected _isResizing = false;

  open = () => {
    let link = this.model.props.url;
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

    if (!this.model.props.title) {
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          title: 'Figma',
        });
      });
    }

    this.disposables.add(
      this.model.propsUpdated.subscribe(({ key }) => {
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
    const { title, description, url } = this.model.props;
    const titleText = title ?? 'Figma';

    return this.renderEmbed(
      () => html`
        <div
          class=${classMap({
            'affine-embed-figma-block': true,
            selected: this.selected$.value,
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
                loading="lazy"
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

            ${description
              ? html`<div class="affine-embed-figma-content-description">
                  ${description}
                </div>`
              : nothing}

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
  protected accessor _showOverlay = true;
}
