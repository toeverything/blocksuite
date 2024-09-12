import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { HoverController } from '@blocksuite/affine-components/hover';
import {
  AttachmentIcon16,
  getAttachmentFileIcons,
} from '@blocksuite/affine-components/icons';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type AttachmentBlockModel,
  AttachmentBlockStyles,
} from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { humanFileSize } from '@blocksuite/affine-shared/utils';
import { Slice } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AttachmentBlockService } from './attachment-service.js';

import { getEmbedCardIcons } from '../_common/utils/url.js';
import { AttachmentOptionsTemplate } from './components/options.js';
import { renderEmbedView } from './embed.js';
import { styles } from './styles.js';
import { checkAttachmentBlob, downloadAttachmentBlob } from './utils.js';

export class AttachmentBlockComponent extends CaptionedBlockComponent<
  AttachmentBlockModel,
  AttachmentBlockService
> {
  static override styles = styles;

  protected _isDragging = false;

  protected _isResizing = false;

  protected _isSelected = false;

  protected _whenHover: HoverController | null = new HoverController(
    this,
    ({ abortController }) => {
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
        (blockSelections.length === 1 &&
          blockSelections[0].blockId !== this.blockId)
      ) {
        return null;
      }

      return {
        template: AttachmentOptionsTemplate({
          anchor: this,
          model: this.model,
          abortController,
        }),
        computePosition: {
          referenceElement: this,
          placement: 'top-start',
          middleware: [flip(), offset(4)],
          autoUpdate: true,
        },
      };
    }
  );

  protected containerStyleMap = styleMap({
    position: 'relative',
    width: '100%',
    margin: '18px 0px',
  });

  copy = () => {
    const slice = Slice.fromModels(this.doc, [this.model]);
    this.std.clipboard.copySlice(slice).catch(console.error);
    toast(this.host, 'Copied to clipboard');
  };

  download = () => {
    downloadAttachmentBlob(this);
  };

  open = () => {
    if (!this.blobUrl) {
      return;
    }
    window.open(this.blobUrl, '_blank');
  };

  refreshData = () => {
    checkAttachmentBlob(this).catch(console.error);
  };

  protected get embedView() {
    if (!this.model.embed || !this.blobUrl) return;
    return renderEmbedView(this.model, this.blobUrl, this.service.maxFileSize);
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

    this.refreshData();

    this.contentEditable = 'false';

    if (!this.model.style) {
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          style: AttachmentBlockStyles[1],
        });
      });
    }

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'sourceId') {
        // Reset the blob url when the sourceId is changed
        if (this.blobUrl) {
          URL.revokeObjectURL(this.blobUrl);
          this.blobUrl = undefined;
        }
        this.refreshData();
      }
    });

    // Workaround for https://github.com/toeverything/blocksuite/issues/4724
    this.disposables.add(ThemeObserver.subscribe(() => this.requestUpdate()));

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

  override disconnectedCallback() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
    super.disconnectedCallback();
  }

  protected onClick(event: MouseEvent) {
    event.stopPropagation();

    this._selectBlock();
  }

  protected onDoubleClick(event: MouseEvent) {
    event.stopPropagation();

    if (this.allowEmbed) {
      this.open();
    } else {
      this.download();
    }
  }

  override renderBlock() {
    const { name, size, style } = this.model;
    const cardStyle = style ?? AttachmentBlockStyles[1];

    const { LoadingIcon } = getEmbedCardIcons();

    const titleIcon = this.loading ? LoadingIcon : AttachmentIcon16;
    const titleText = this.loading ? 'Loading...' : name;
    const infoText = this.error ? 'File loading failed.' : humanFileSize(size);

    const fileType = name.split('.').pop() ?? '';
    const FileTypeIcon = getAttachmentFileIcons(fileType);

    const embedView = this.embedView;

    return html`
      <div
        ${this._whenHover ? ref(this._whenHover.setReference) : nothing}
        class="affine-attachment-container"
        style=${this.containerStyleMap}
      >
        ${embedView
          ? html`<div
              class="affine-attachment-embed-container"
              @click=${this.onClick}
              @dblclick=${this.onDoubleClick}
            >
              ${embedView}

              <div
                class=${classMap({
                  'affine-attachment-iframe-overlay': true,
                  hide: !this._showOverlay,
                })}
              ></div>
            </div>`
          : html`<div
              class=${classMap({
                'affine-attachment-card': true,
                [cardStyle]: true,
                loading: this.loading,
                error: this.error,
                unsynced: false,
              })}
              @click=${this.onClick}
              @dblclick=${this.onDoubleClick}
            >
              <div class="affine-attachment-content">
                <div class="affine-attachment-content-title">
                  <div class="affine-attachment-content-title-icon">
                    ${titleIcon}
                  </div>

                  <div class="affine-attachment-content-title-text">
                    ${titleText}
                  </div>
                </div>

                <div class="affine-attachment-content-info">${infoText}</div>
              </div>

              <div class="affine-attachment-banner">${FileTypeIcon}</div>
            </div>`}
      </div>
    `;
  }

  @state()
  protected accessor _showOverlay = true;

  @property({ attribute: false })
  accessor allowEmbed = false;

  @property({ attribute: false })
  accessor blobUrl: string | undefined = undefined;

  @property({ attribute: false })
  accessor downloading = false;

  @property({ attribute: false })
  accessor error = false;

  @property({ attribute: false })
  accessor loading = false;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-attachment': AttachmentBlockComponent;
  }
}
