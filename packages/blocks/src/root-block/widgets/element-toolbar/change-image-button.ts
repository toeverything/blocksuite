import '../../edgeless/components/buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CaptionIcon } from '../../../_common/icons/text.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
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

  private _showCaption() {
    this._blockElement?.captionEditor.show();
  }

  override render() {
    return html`
      <edgeless-tool-icon-button
        aria-label="Add caption"
        .tooltip=${'Add caption'}
        class="change-image-button caption"
        ?disabled=${this._doc.readonly}
        @click=${() => this._showCaption()}
      >
        ${CaptionIcon}
      </edgeless-tool-icon-button>
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
