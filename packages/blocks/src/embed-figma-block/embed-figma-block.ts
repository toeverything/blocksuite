import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar.js';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/controller.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import { OpenIcon } from '../_common/icons/text.js';
import type { EmbedFigmaStyles } from './embed-figma-model.js';
import { type EmbedFigmaModel } from './embed-figma-model.js';
import type { EmbedFigmaService } from './embed-figma-service.js';
import { FigmaIcon, styles } from './styles.js';

@customElement('affine-embed-figma-block')
export class EmbedFigmaBlockComponent extends EmbedBlockElement<
  EmbedFigmaModel,
  EmbedFigmaService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedFigmaStyles)[number] = 'figma';

  @state()
  private _isSelected = false;

  @state()
  private _showOverlay = true;

  @query('.affine-embed-figma-block')
  private _figmaBlockEl!: HTMLDivElement;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isDragging = false;

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {};

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

  override connectedCallback() {
    super.connectedCallback();

    if (!this.model.description && !this.model.title) {
      this.page.withoutTransact(() => {
        this.page.updateBlock(this.model, {
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
      this.std.selection.slots.changed.on(sels => {
        this._isSelected = sels.some(sel =>
          PathFinder.equals(sel.path, this.path)
        );
        this._showOverlay = this._isDragging || !this._isSelected;
      })
    );
    // this is required to prevent iframe from capturing pointer events
    this.handleEvent('pointerMove', ctx => {
      this._isDragging = ctx.get('pointerState').dragging;
      if (this._isDragging) this._showOverlay = true;
    });

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);
      this.disposables.add(
        this.model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );
    }
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    const selection = this.host.selection;
    const textSelection = selection.find('text');
    if (
      !!textSelection &&
      (!!textSelection.to || !!textSelection.from.length)
    ) {
      return null;
    }

    const blockSelections = selection.filter('block');
    if (
      blockSelections.length > 1 ||
      (blockSelections.length === 1 && blockSelections[0].path !== this.path)
    ) {
      return null;
    }

    return {
      template: html`
        <style>
          :host {
            z-index: 1;
          }
        </style>
        <embed-card-toolbar
          .model=${this.model}
          .block=${this}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.std}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this._figmaBlockEl,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override renderBlock() {
    const { title, description, style, url } = this.model;

    this._cardStyle = style;
    this._width = EMBED_CARD_WIDTH[this._cardStyle];
    this._height = EMBED_CARD_HEIGHT[this._cardStyle];

    const titleText = title ?? 'Figma';
    const descriptionText = description ?? url;

    return this.renderEmbed(
      () => html`
        <div
          style=${styleMap({
            position: 'relative',
          })}
        >
          <div
            ${this.isInSurface ? null : ref(this._whenHover.setReference)}
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

          ${this.selected?.is('block')
            ? html`<affine-block-selection></affine-block-selection>`
            : nothing}
        </div>
      `
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-figma-block': EmbedFigmaBlockComponent;
  }
}
