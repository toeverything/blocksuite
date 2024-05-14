import '../../edgeless/components/buttons/tool-icon-button.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CaptionIcon } from '../../../_common/icons/text.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-change-image-button')
export class EdgelessChangeImageButton extends WithDisposable(LitElement) {
  static override styles = css`
    .change-image-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .change-image-button {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    component-toolbar-menu-divider {
      height: 24px;
    }
  `;

  @property({ attribute: false })
  model!: ImageBlockModel;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  private get _doc() {
    return this.model.doc;
  }

  private get _blockElement() {
    const blockSelection = this.edgeless.service.selection.selections.filter(
      sel => sel.elements.includes(this.model.id)
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
    this._blockElement?.captionElement.show();
  }

  override render() {
    return html`
      <div class="change-image-container">
        <edgeless-tool-icon-button
          .tooltip=${'Add Caption'}
          class="change-image-button caption"
          ?disabled=${this._doc.readonly}
          @click=${() => this._showCaption()}
        >
          ${CaptionIcon}
        </edgeless-tool-icon-button>
      </div>
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

  return html`<edgeless-change-image-button
    .model=${images[0]}
    .edgeless=${edgeless}
  ></edgeless-change-image-button>`;
}
