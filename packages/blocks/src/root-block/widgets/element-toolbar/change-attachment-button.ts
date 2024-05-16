import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/panel/card-style-panel.js';
import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import { CaptionIcon, PaletteIcon } from '../../../_common/icons/text.js';
import type { EmbedCardStyle } from '../../../_common/types.js';
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import type {
  AttachmentBlockComponent,
  AttachmentBlockModel,
  EdgelessRootBlockComponent,
} from '../../../index.js';
import { Bound } from '../../../surface-block/index.js';

@customElement('edgeless-change-attachment-button')
export class EdgelessChangeAttachmentButton extends WithDisposable(LitElement) {
  static override styles = css`
    .change-attachment-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .change-attachment-button {
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

    card-style-panel {
      display: none;
    }
    card-style-panel[data-show] {
      display: flex;
    }
  `;

  @property({ attribute: false })
  model!: AttachmentBlockModel;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _showPopper = false;

  @query('.change-attachment-button.card-style')
  private _cardStyleButton!: HTMLDivElement;

  @query('card-style-panel')
  private _cardStylePanel!: HTMLDivElement;

  private get _doc() {
    return this.model.doc;
  }

  get std() {
    return this.edgeless.std;
  }

  private _cardStylePopper: ReturnType<typeof createButtonPopper> | null = null;

  private get _blockElement() {
    const blockSelection = this.edgeless.service.selection.selections.filter(
      sel => sel.elements.includes(this.model.id)
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

  private _showCaption() {
    this._blockElement?.captionElement.show();
  }

  private _setCardStyle(style: EmbedCardStyle) {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });
    this._cardStylePopper?.hide();
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    this._cardStylePopper = createButtonPopper(
      this._cardStyleButton,
      this._cardStylePanel,
      ({ display }) => {
        this._showPopper = display === 'show';
      }
    );
    this._disposables.add(this._cardStylePopper);
    super.firstUpdated(changedProperties);
  }

  override render() {
    const model = this.model;

    return html`
      <div class="change-attachment-container">
        <div class="change-attachment-button card-style">
          <edgeless-tool-icon-button
            .tooltip=${this._showPopper ? '' : 'Card style'}
            .iconContainerPadding=${2}
            ?disabled=${this._doc.readonly}
            @click=${() => this._cardStylePopper?.toggle()}
          >
            ${PaletteIcon}
          </edgeless-tool-icon-button>

          <card-style-panel
            .value=${model.style}
            .options=${this._getCardStyleOptions}
            .onSelect=${(value: EmbedCardStyle) => this._setCardStyle(value)}
          >
          </card-style-panel>
        </div>

        <component-toolbar-menu-divider
          .vertical=${true}
        ></component-toolbar-menu-divider>

        <edgeless-tool-icon-button
          .tooltip=${'Add Caption'}
          .iconContainerPadding=${2}
          class="change-attachment-button caption"
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
    'edgeless-change-attachment-button': EdgelessChangeAttachmentButton;
  }
}

export function renderAttachmentButton(
  edgeless: EdgelessRootBlockComponent,
  attachments?: AttachmentBlockModel[]
) {
  if (attachments?.length !== 1) return nothing;

  return html`<edgeless-change-attachment-button
    .model=${attachments[0]}
    .edgeless=${edgeless}
  ></edgeless-change-attachment-button>`;
}
