import {
  type AttachmentBlockComponent,
  attachmentViewDropdownMenu,
} from '@blocksuite/affine-block-attachment';
import { getEmbedCardIcons } from '@blocksuite/affine-block-embed';
import {
  CaptionIcon,
  DownloadIcon,
  PaletteIcon,
} from '@blocksuite/affine-components/icons';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import type {
  AttachmentBlockModel,
  EmbedCardStyle,
} from '@blocksuite/affine-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import {
  ThemeProvider,
  ToolbarContext,
} from '@blocksuite/affine-shared/services';
import { Bound } from '@blocksuite/global/gfx';
import { WithDisposable } from '@blocksuite/global/lit';
import type { TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

export class EdgelessChangeAttachmentButton extends WithDisposable(LitElement) {
  private readonly _download = () => {
    this._block?.download();
  };

  private readonly _setCardStyle = (style: EmbedCardStyle) => {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });
  };

  private readonly _showCaption = () => {
    this._block?.captionEditor?.show();
  };

  private get _block() {
    const block = this.std.view.getBlock(this.model.id);
    if (!block) return null;
    return block as AttachmentBlockComponent;
  }

  private get _doc() {
    return this.model.doc;
  }

  private get _getCardStyleOptions(): {
    style: EmbedCardStyle;
    Icon: TemplateResult<1>;
    tooltip: string;
  }[] {
    const theme = this.std.get(ThemeProvider).theme;
    const { EmbedCardListIcon, EmbedCardCubeIcon } = getEmbedCardIcons(theme);
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

  get std() {
    return this.edgeless.std;
  }

  override render() {
    return join(
      [
        this.model.props.style === 'pdf'
          ? null
          : html`
              <editor-menu-button
                .contentPadding=${'8px'}
                .button=${html`
                  <editor-icon-button
                    aria-label="Card style"
                    .tooltip=${'Card style'}
                  >
                    ${PaletteIcon}
                  </editor-icon-button>
                `}
              >
                <card-style-panel
                  .value=${this.model.props.style}
                  .options=${this._getCardStyleOptions}
                  .onSelect=${this._setCardStyle}
                >
                </card-style-panel>
              </editor-menu-button>
            `,

        // TODO(@fundon): should remove it when refactoring the element toolbar
        attachmentViewDropdownMenu(new ToolbarContext(this.std)),

        html`
          <editor-icon-button
            aria-label="Download"
            .tooltip=${'Download'}
            ?disabled=${this._doc.readonly}
            @click=${this._download}
          >
            ${DownloadIcon}
          </editor-icon-button>
        `,
        html`
          <editor-icon-button
            aria-label="Add caption"
            .tooltip=${'Add caption'}
            class="change-attachment-button caption"
            ?disabled=${this._doc.readonly}
            @click=${this._showCaption}
          >
            ${CaptionIcon}
          </editor-icon-button>
        `,
      ].filter(button => button !== null),
      renderToolbarSeparator
    );
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor model!: AttachmentBlockModel;
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
