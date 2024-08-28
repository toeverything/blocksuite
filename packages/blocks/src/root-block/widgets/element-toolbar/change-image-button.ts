import type { ImageBlockModel } from '@blocksuite/affine-model';

import {
  CaptionIcon,
  CropIcon,
  DoneIcon,
  DownloadIcon,
} from '@blocksuite/affine-components/icons';
import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import type { ImageEdgelessBlockComponent } from '../../../image-block/image-edgeless-block.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import { downloadImageBlob } from '../../../image-block/utils.js';

export class EdgelessChangeImageButton extends WithDisposable(LitElement) {
  private _cancelCrop = () => {
    this._blockComponent?.cleanupCrop();
  };

  private _crop = () => {
    void this._blockComponent?.crop();
  };

  private _download = () => {
    if (!this._blockComponent) return;
    downloadImageBlob(this._blockComponent).catch(console.error);
  };

  private _showCaption = () => {
    this._blockComponent?.captionEditor?.show();
  };

  private _startCrop = () => {
    if (!this.edgeless.doc.awarenessStore.getFlag('enable_image_cropping'))
      return;
    void this._blockComponent?.startCrop();
  };

  private get _blockComponent() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const block = this.edgeless.std.view.getBlock(
      blockSelection[0].blockId
    ) as ImageEdgelessBlockComponent | null;

    return block;
  }

  private get _doc() {
    return this.model.doc;
  }

  override connectedCallback() {
    super.connectedCallback();
    const { _disposables, edgeless } = this;
    _disposables.add(
      edgeless.slots.croppingStatusUpdated.on(() => this.requestUpdate())
    );
  }

  override render() {
    if (
      this.edgeless.doc.awarenessStore.getFlag('enable_image_cropping') &&
      this._blockComponent?.cropping
    ) {
      return html`
        <editor-icon-button
          aria-label="Cancel"
          .tooltip=${'Cancel'}
          ?disabled=${this._doc.readonly}
          @click=${this._cancelCrop}
        >
          Cancel cropping
        </editor-icon-button>

        <editor-toolbar-separator></editor-toolbar-separator>

        <editor-icon-button
          aria-label="Done"
          .tooltip=${'Done'}
          ?disabled=${this._doc.readonly}
          @click=${this._crop}
        >
          ${DoneIcon}
          <span style="color:var(--affine-brand-color);padding-left:2px;"
            >Done</span
          >
        </editor-icon-button>
      `;
    }
    return html`
      ${when(
        this.edgeless.doc.awarenessStore.getFlag('enable_image_cropping'),
        () =>
          html`<editor-icon-button
              aria-label="Crop Image"
              .tooltip=${'Crop Image'}
              ?disabled=${this._doc.readonly}
              @click=${this._startCrop}
            >
              ${CropIcon}
            </editor-icon-button>

            <editor-toolbar-separator></editor-toolbar-separator>`
      )}

      <editor-icon-button
        aria-label="Download"
        .tooltip=${'Download'}
        ?disabled=${this._doc.readonly}
        @click=${this._download}
      >
        ${DownloadIcon}
      </editor-icon-button>

      <editor-toolbar-separator></editor-toolbar-separator>

      <editor-icon-button
        aria-label="Add caption"
        .tooltip=${'Add caption'}
        class="change-image-button caption"
        ?disabled=${this._doc.readonly}
        @click=${this._showCaption}
      >
        ${CaptionIcon}
      </editor-icon-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor model!: ImageBlockModel;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-image-button': EdgelessChangeImageButton;
  }
}

export function renderChangeImageButton(
  edgeless: EdgelessRootBlockComponent,
  images?: ImageBlockModel[]
) {
  if (images?.length !== 1) return nothing;

  return html`
    <edgeless-change-image-button
      .model=${images[0]}
      .edgeless=${edgeless}
    ></edgeless-change-image-button>
  `;
}
