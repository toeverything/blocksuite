import '../buttons/tool-icon-button.js';
import './component-toolbar-menu-divider.js';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { CaptionIcon } from '../../../../_common/icons/text.js';
import type { ImageBlockComponent } from '../../../../image-block/image-block.js';
import type { ImageBlockModel } from '../../../../image-block/image-model.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';

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
  std!: BlockStdScope;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  private get _doc() {
    return this.model.doc;
  }

  private get _blockElement() {
    const blockSelection =
      this.surface.edgeless.service.selection.selections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockElement = this.std.view.viewFromPath(
      'block',
      blockSelection[0].path
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
