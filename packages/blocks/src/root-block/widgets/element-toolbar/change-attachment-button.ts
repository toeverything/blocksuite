import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/card-style-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import { CaptionIcon, PaletteIcon } from '../../../_common/icons/text.js';
import type { EmbedCardStyle } from '../../../_common/types.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import type {
  AttachmentBlockComponent,
  AttachmentBlockModel,
  EdgelessRootBlockComponent,
} from '../../../index.js';
import { Bound } from '../../../surface-block/index.js';

@customElement('edgeless-change-attachment-button')
export class EdgelessChangeAttachmentButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  accessor model!: AttachmentBlockModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private get _doc() {
    return this.model.doc;
  }

  get std() {
    return this.edgeless.std;
  }

  private get _blockElement() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockElement = this.std.view.getBlock(
      blockSelection[0].blockId
    ) as AttachmentBlockComponent | null;
    assertExists(blockElement);

    return blockElement;
  }

  private get _getCardStyleOptions(): {
    style: EmbedCardStyle;
    Icon: TemplateResult<1>;
    tooltip: string;
  }[] {
    const { EmbedCardListIcon, EmbedCardCubeIcon } = getEmbedCardIcons();
    return [
      {
        style: 'horizontalThin',
        Icon: EmbedCardListIcon,
        tooltip: 'Horizontal style',
      },
      {
        style: 'cubeThick',
        Icon: EmbedCardCubeIcon,
        tooltip: 'Vertical style',
      },
    ];
  }

  private _showCaption = () => {
    this._blockElement?.captionEditor.show();
  };

  private _setCardStyle = (style: EmbedCardStyle) => {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });
  };

  override render() {
    return html`
      <edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <edgeless-tool-icon-button
            aria-label="Card style"
            .tooltip=${'Card style'}
          >
            ${PaletteIcon}
          </edgeless-tool-icon-button>
        `}
      >
        <card-style-panel
          slot
          .value=${this.model.style}
          .options=${this._getCardStyleOptions}
          .onSelect=${this._setCardStyle}
        >
        </card-style-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-tool-icon-button
        aria-label="Add caption"
        .tooltip=${'Add caption'}
        class="change-attachment-button caption"
        ?disabled=${this._doc.readonly}
        @click=${this._showCaption}
      >
        ${CaptionIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-attachment-button': EdgelessChangeAttachmentButton;
  }
}

export function renderAttachmentButton(
  edgeless: EdgelessRootBlockComponent,
  attachments?: AttachmentBlockModel[]
) {
  if (attachments?.length !== 1) return nothing;

  return html`
    <edgeless-change-attachment-button
      .model=${attachments[0]}
      .edgeless=${edgeless}
    ></edgeless-change-attachment-button>
  `;
}
