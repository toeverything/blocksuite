import type { EmbedHtmlModel, EmbedHtmlStyles } from '@blocksuite/affine-model';

import { html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { EmbedHtmlBlockService } from './embed-html-service.js';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockComponent } from '../_common/embed-block-helper/index.js';
import './components/fullscreen-toolbar.js';
import { HtmlIcon, styles } from './styles.js';

@customElement('affine-embed-html-block')
export class EmbedHtmlBlockComponent extends EmbedBlockComponent<
  EmbedHtmlModel,
  EmbedHtmlBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedHtmlStyles)[number] = 'html';

  protected _isDragging = false;

  protected _isResizing = false;

  close = () => {
    document.exitFullscreen().catch(console.error);
  };

  protected embedHtmlStyle: StyleInfo = {};

  open = () => {
    this.iframeWrapper?.requestFullscreen().catch(console.error);
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

  override renderBlock(): unknown {
    const { style } = this.model;

    this._cardStyle = style;
    this._width = EMBED_CARD_WIDTH[style];
    this._height = EMBED_CARD_HEIGHT[style];
    this.embedHtmlStyle = {
      width: '100%',
      height: `${this._height}px`,
    };

    const titleText = 'Basic HTML Page Structure';

    const htmlSrc = `
      <style>
        body {
          margin: 0;
        }
      </style>
      ${this.model.html}
    `;

    return this.renderEmbed(() => {
      if (!this.model.html) {
        return html` <div class="affine-html-empty">Empty</div>`;
      }
      return html`
        <div
          class=${classMap({
            'affine-embed-html-block': true,
            selected: this._isSelected,
          })}
          style=${styleMap(this.embedHtmlStyle)}
          @click=${this._handleClick}
          @dblclick=${this._handleDoubleClick}
        >
          <div class="affine-embed-html">
            <div class="affine-embed-html-iframe-container">
              <div class="embed-html-block-iframe-wrapper" allowfullscreen>
                <iframe
                  class="embed-html-block-iframe"
                  sandbox="allow-scripts"
                  scrolling="no"
                  .srcdoc=${htmlSrc}
                ></iframe>
                <embed-html-fullscreen-toolbar
                  .embedHtml=${this}
                ></embed-html-fullscreen-toolbar>
              </div>

              <div
                class=${classMap({
                  'affine-embed-html-iframe-overlay': true,
                  hide: !this._showOverlay,
                })}
              ></div>
            </div>
          </div>

          <div class="affine-embed-html-title">
            <div class="affine-embed-html-title-icon">${HtmlIcon}</div>

            <div class="affine-embed-html-title-text">${titleText}</div>
          </div>
        </div>
      `;
    });
  }

  @state()
  protected accessor _isSelected = false;

  @state()
  protected accessor _showOverlay = true;

  @query('.embed-html-block-iframe-wrapper')
  accessor iframeWrapper!: HTMLDivElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-html-block': EmbedHtmlBlockComponent;
  }
}
