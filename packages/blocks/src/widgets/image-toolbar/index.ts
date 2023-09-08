import { assertExists } from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import { autoUpdate, computePosition, offset, shift } from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PAGE_HEADER_HEIGHT } from '../../__internal__/consts.js';
import { on } from '../../__internal__/utils/common.js';
import { stopPropagation } from '../../__internal__/utils/event.js';
import { turnImageIntoCardView } from '../../attachment-block/utils.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  HighLightDuotoneIcon,
} from '../../icons/index.js';
import {
  copyImage,
  downloadImage,
  focusCaption,
} from '../../image-block/image/utils.js';
import type { ImageBlockComponent } from '../../image-block/index.js';
import { type ImageBlockModel } from '../../image-block/index.js';
import { openLeditsEditor } from '../../image-block/ledits/main.js';

@customElement('affine-image-toolbar-widget')
export class AffineImageToolbarWidget extends WidgetElement {
  static override styles = [
    css`
      :host {
        position: absolute;
      }

      .affine-embed-editing-state-container > div {
        display: block;
        z-index: var(--affine-z-index-popover);
      }

      .embed-editing-state {
        box-sizing: border-box;
        box-shadow: var(--affine-shadow-2);
        border-radius: 8px;
        list-style: none;
        padding: 4px;
        background-color: var(--affine-background-overlay-panel-color);
        margin: 0;
      }
      .has-tool-tip.delete-image-button:hover {
        background: var(--affine-background-error-color);
        color: var(--affine-error-color);
      }
      .has-tool-tip.delete-image-button:hover > svg {
        color: var(--affine-error-color);
      }
    `,
    tooltipStyle,
  ];

  private _hovered = false;
  private _hideTimer: ReturnType<typeof setTimeout> | null = null;
  private _hiddenCleanup: (() => void)[] = [];
  private imageModel: ImageBlockModel | null = null;
  private blob: Blob | null = null;

  get supportAttachment() {
    return this.page.schema.flavourSchemaMap.has('affine:attachment');
  }

  private _onHover = () => {
    this._hovered = true;
  };

  private _onHoverLeave = () => {
    this._hovered = false;
    this._hideAfterDelay();
  };

  private _hideAfterDelay = () => {
    if (this._hideTimer) clearTimeout(this._hideTimer);

    this._hideTimer = setTimeout(() => {
      if (!this._hovered) {
        this.hide();
      }
      this._hideTimer = null;
    }, 150);
  };

  private async _updatePosition(anchor: HTMLElement) {
    const pos = await computePosition(anchor, this, {
      placement: 'right-start',
      middleware: [
        offset({
          mainAxis: 12,
          crossAxis: 10,
        }),
        shift({
          crossAxis: true,
          padding: {
            top: PAGE_HEADER_HEIGHT + 12,
            bottom: 12,
            right: 12,
          },
        }),
      ],
    });

    this.style.left = `${pos.x}px`;
    this.style.top = `${pos.y}px`;
  }

  async show(options: {
    anchor: HTMLElement;
    model: ImageBlockModel;
    blob: Blob;
  }) {
    if (this.imageModel && this.imageModel !== options.model) {
      this.clear();
    }

    this.imageModel = options.model;
    this.blob = options.blob;
    this.requestUpdate();

    await this.updateComplete;
    await this._updatePosition(options.anchor);

    this._hiddenCleanup.push(
      autoUpdate(options.anchor, this, () =>
        this._updatePosition(options.anchor)
      )
    );
    this._hiddenCleanup.push(
      on(options.anchor, 'mouseover', () => {
        this._onHover();
      })
    );
    this._hiddenCleanup.push(
      on(options.anchor, 'mouseleave', () => {
        this._onHoverLeave();
      })
    );
  }

  clear() {
    this._hiddenCleanup.forEach(cleanup => cleanup());
    this._hiddenCleanup = [];
    this.imageModel = null;
    this.blob = null;
  }

  hide() {
    this.clear();
    this.requestUpdate();
  }

  override connectedCallback() {
    super.connectedCallback();

    this.pageElement.handleEvent('pointerMove', ctx => {
      const e = ctx.get('pointerState');
      const target = e.raw.target as HTMLElement;

      if (target.tagName !== 'IMG') return;

      const image = target.closest('affine-image') as ImageBlockComponent;

      this.show({
        anchor: image.resizeImg,
        model: image.model,
        blob: image.blob,
      });
    });
  }

  override render() {
    const { imageModel: model, blob } = this;
    const { readonly } = this.page;

    if (!model) return nothing;

    assertExists(blob);

    return html`
      <div
        class="affine-embed-editing-state-container"
        @pointerdown=${stopPropagation}
        @mouseover=${this._onHover}
        @mouseout=${this._onHoverLeave}
      >
        <div class="embed-editing-state">
          ${readonly || !this.supportAttachment
            ? nothing
            : html`<icon-button
                class="has-tool-tip"
                size="32px"
                @click=${() => {
                  this.hide();
                  turnImageIntoCardView(model, blob);
                }}
              >
                ${BookmarkIcon}
                <tool-tip inert role="tooltip">Turn into Card view</tool-tip>
              </icon-button>`}
          ${readonly
            ? nothing
            : html`<icon-button
                class="has-tool-tip"
                size="32px"
                @click=${() => focusCaption(model)}
              >
                ${CaptionIcon}
                <tool-tip inert tip-position="right" role="tooltip"
                  >Caption</tool-tip
                >
              </icon-button>`}
          <icon-button
            class="has-tool-tip"
            size="32px"
            @click=${() => downloadImage(model)}
          >
            ${DownloadIcon}
            <tool-tip inert tip-position="right" role="tooltip"
              >Download</tool-tip
            >
          </icon-button>
          <icon-button
            class="has-tool-tip"
            size="32px"
            @click=${() => copyImage(model)}
          >
            ${CopyIcon}
            <tool-tip inert tip-position="right" role="tooltip"
              >Copy to clipboard</tool-tip
            >
          </icon-button>
          ${readonly
            ? nothing
            : html`<icon-button
                class="has-tool-tip delete-image-button"
                size="32px"
                @click="${() => {
                  this.hide();
                  model.page.deleteBlock(model);
                }}"
              >
                ${DeleteIcon}
                <tool-tip inert tip-position="right" role="tooltip"
                  >Delete</tool-tip
                >
              </icon-button>`}
          ${readonly ||
          !this.page.awarenessStore.getFlag('enable_bultin_ledits')
            ? nothing
            : html`<icon-button
                class="has-tool-tip"
                size="32px"
                @click="${() => {
                  this.hide();
                  openLeditsEditor(model, blob, this.root);
                }}"
              >
                ${HighLightDuotoneIcon}
                <tool-tip inert tip-position="right" role="tooltip"
                  >Edit with LEDITS</tool-tip
                >
              </icon-button>`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image-toolbar-widget': AffineImageToolbarWidget;
  }
}
