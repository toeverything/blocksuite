import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import { assertExists } from '@blocksuite/global/utils';
import { html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { Bound } from '../surface-block/utils/bound.js';
import type { EmbedHtmlModel, EmbedHtmlStyles } from './embed-html-model.js';
import type { EmbedHtmlService } from './embed-html-service.js';
import { HtmlIcon, styles } from './styles.js';

@customElement('affine-embed-html-block')
export class EmbedHtmlBlockComponent extends EmbedBlockElement<
  EmbedHtmlModel,
  EmbedHtmlService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedHtmlStyles)[number] = 'html';

  @state()
  private _isSelected = false;

  @state()
  private _showOverlay = true;

  @query('iframe')
  private _iframe!: HTMLIFrameElement;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isDragging = false;

  private _isResizing = false;

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
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
    this._iframe.requestFullscreen().catch(console.error);
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

  private _fullscreenchange() {
    const iframe = this._iframe;
    if (!iframe) return;

    const show =
      document.fullscreenEnabled && document.fullscreenElement === iframe;

    iframe.contentWindow?.postMessage({ show }, '*');
  }

  private _tipHtml() {
    const computed = getComputedStyle(this);
    const fontFamily = computed.getPropertyValue('--affine-font-sans-family');
    const fontSize = computed.getPropertyValue('--affine-font-sm');
    const borderColor = computed.getPropertyValue('--affine-black-10');
    const backgroundColor = computed.getPropertyValue('--affine-primary-color');
    const tipColor = computed.getPropertyValue('--affine-white');
    const color = computed.getPropertyValue('--affine-text-secondary-color');

    return `<style>
      #affine-tip {
        display: none;
        align-items: center;
        gap: 4px;
        height: 28px;
        position: absolute;
        left: 50%;
        bottom: 30px;
        z-index: 10000;
        transform: translate3d(-50%, 0, 0);

        font-family: ${fontFamily};
        color: ${color};
        font-feature-settings:
          'clig' off,
          'liga' off;
        font-size:  ${fontSize};
        font-style: normal;
        font-weight: 500;
        line-height: 22px; /* 157.143% */
      }
      #affine-tip > .key {
        display: inline-flex;
        padding: 4px 8px;
        justify-content: center;
        align-items: center;
        gap: 4px;
        border-radius: 8px;
        color: ${tipColor};
        border: 1px solid ${borderColor};
        background: ${backgroundColor};
      }

      #affine-tip[data-show] {
        display: flex;
      }
      </style>
      <div id="affine-tip">
        Press&nbsp;<span class="key">ESC</span>&nbsp;to&nbsp;close
      </div>
      <script>
      const tip = document.getElementById('affine-tip');
      window.onmessage = function(event){
        tip.toggleAttribute('data-show', event.data && event.data.show);
      };
      </script>
      `;
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
      ${this._tipHtml()}
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
              <iframe
                class="embed-html-block-iframe"
                sandbox="allow-scripts"
                scrolling="no"
                allowfullscreen
                @fullscreenchange=${this._fullscreenchange}
                .srcdoc=${htmlSrc}
              ></iframe>

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

        <embed-card-caption .block=${this}></embed-card-caption>

        <affine-block-selection .block=${this}></affine-block-selection>
      `;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-html-block': EmbedHtmlBlockComponent;
  }
}
