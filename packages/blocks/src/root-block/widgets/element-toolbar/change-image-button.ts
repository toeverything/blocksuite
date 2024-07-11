import '../../../_common/components/toolbar/icon-button.js';
import '../../../_common/components/toolbar/separator.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CaptionIcon, DownloadIcon } from '../../../_common/icons/text.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
import { downloadImageBlob } from '../../../image-block/utils.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-change-image-button')
export class EdgelessChangeImageButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  accessor model!: ImageBlockModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private get _doc() {
    return this.model.doc;
  }

  private get _blockElement() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockElement = this.edgeless.std.view.getBlock(
      blockSelection[0].blockId
    ) as ImageBlockComponent | null;
    assertExists(blockElement);

    return blockElement;
  }

  private _showCaption = () => {
    this._blockElement?.captionEditor.show();
  };

  private _download = () => {
    if (!this._blockElement) return;
    downloadImageBlob(this._blockElement).catch(console.error);
  };

  override render() {
    return html`
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
