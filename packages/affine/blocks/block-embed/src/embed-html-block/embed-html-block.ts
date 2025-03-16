import type { EmbedHtmlModel, EmbedHtmlStyles } from '@blocksuite/affine-model';
import { BlockSelection } from '@blocksuite/block-std';
import { html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { HtmlIcon, styles } from './styles.js';

export class EmbedHtmlBlockComponent extends EmbedBlockComponent<EmbedHtmlModel> {
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

  override renderBlock(): unknown {
    const titleText = 'Basic HTML Page Structure';

    const htmlSrc = `
      <style>
        body {
          margin: 0;
        }
      </style>
      ${this.model.props.html}
    `;

    return this.renderEmbed(() => {
      if (!this.model.props.html) {
        return html` <div class="affine-html-empty">Empty</div>`;
      }
      return html`
        <div
          class=${classMap({
            'affine-embed-html-block': true,
            selected: this.selected$.value,
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
                  loading="lazy"
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
  protected accessor _showOverlay = true;

  @query('.embed-html-block-iframe-wrapper')
  accessor iframeWrapper!: HTMLDivElement;
}
