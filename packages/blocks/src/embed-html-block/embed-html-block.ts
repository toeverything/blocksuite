import './components/fullscreen-toolbar.js';

import { assertExists } from '@blocksuite/global/utils';
import { html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { EmbedHtmlModel, EmbedHtmlStyles } from './embed-html-model.js';
import type { EmbedHtmlBlockService } from './embed-html-service.js';
import { HtmlIcon, styles } from './styles.js';

@customElement('affine-embed-html-block')
export class EmbedHtmlBlockComponent extends EmbedBlockElement<
  EmbedHtmlModel,
  EmbedHtmlBlockService
> {
  static override styles = styles;

  @state()
  private accessor _isSelected = false;

  @state()
  private accessor _showOverlay = true;

  private _isDragging = false;

  private _isResizing = false;

  override _cardStyle: (typeof EmbedHtmlStyles)[number] = 'html';

  @query('.embed-html-block-iframe-wrapper')
  accessor iframeWrapper!: HTMLDivElement;

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
    this.iframeWrapper?.requestFullscreen().catch(console.error);
  };

  close = () => {
    document.exitFullscreen().catch(console.error);
  };

  refreshData = () => {};

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

  override renderBlock(): unknown {
    const { style, xywh } = this.model;

    this._cardStyle = style;

    const bound = Bound.deserialize(xywh);
    this._width = this.isInSurface ? bound.w : EMBED_CARD_WIDTH[style];
    this._height = this.isInSurface ? bound.h : EMBED_CARD_HEIGHT[style];

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
          style=${styleMap({
            width: this.isInSurface ? `${this._width}px` : '100%',
            height: `${this._height}px`,
          })}
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
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-html-block': EmbedHtmlBlockComponent;
  }
}
