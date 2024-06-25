import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/card-style-panel.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import {
  css,
  html,
  LitElement,
  nothing,
  type TemplateResult,
  unsafeCSS,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { join } from 'lit/directives/join.js';

import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import { isPeekable, peek } from '../../../_common/components/index.js';
import { toast } from '../../../_common/components/toast.js';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import {
  BookmarkIcon,
  SmallArrowDownIcon,
} from '../../../_common/icons/edgeless.js';
import {
  CaptionIcon,
  CenterPeekIcon,
  CopyIcon,
  EditIcon,
  EmbedEdgelessIcon,
  EmbedPageIcon,
  EmbedWebIcon,
  ExpandFullIcon,
  OpenIcon,
  PaletteIcon,
} from '../../../_common/icons/text.js';
import type { EmbedCardStyle } from '../../../_common/types.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import { BookmarkStyles } from '../../../bookmark-block/bookmark-model.js';
import type {
  BookmarkBlockComponent,
  BookmarkBlockModel,
} from '../../../bookmark-block/index.js';
import type {
  EmbedFigmaBlockComponent,
  EmbedFigmaModel,
} from '../../../embed-figma-block/index.js';
import type {
  EmbedGithubBlockComponent,
  EmbedGithubModel,
} from '../../../embed-github-block/index.js';
import type { EmbedHtmlModel } from '../../../embed-html-block/index.js';
import type {
  EmbedLinkedDocBlockComponent,
  EmbedLinkedDocModel,
} from '../../../embed-linked-doc-block/index.js';
import type {
  EmbedLoomBlockComponent,
  EmbedLoomModel,
} from '../../../embed-loom-block/index.js';
import type {
  EmbedSyncedDocBlockComponent,
  EmbedSyncedDocModel,
} from '../../../embed-synced-doc-block/index.js';
import type {
  EmbedYoutubeBlockComponent,
  EmbedYoutubeModel,
} from '../../../embed-youtube-block/index.js';
import { Bound } from '../../../surface-block/index.js';
import { renderMenuDivider } from '../../edgeless/components/buttons/menu-button.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedHtmlBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../edgeless/utils/query.js';
import type { EmbedOptions } from '../../root-service.js';

@customElement('edgeless-change-embed-card-button')
export class EdgelessChangeEmbedCardButton extends WithDisposable(LitElement) {
  private get _doc() {
    return this.model.doc;
  }

  private get std() {
    return this.edgeless.std;
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private get _blockElement() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockElement = this.std.view.getBlock(blockSelection[0].blockId) as
      | BookmarkBlockComponent
      | EmbedGithubBlockComponent
      | EmbedYoutubeBlockComponent
      | EmbedFigmaBlockComponent
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent
      | EmbedLoomBlockComponent
      | null;
    assertExists(blockElement);

    return blockElement;
  }

  private get _canShowUrlOptions() {
    return (
      'url' in this.model &&
      (isBookmarkBlock(this.model) ||
        isEmbedGithubBlock(this.model) ||
        isEmbedLinkedDocBlock(this.model))
    );
  }

  private get _canShowFullScreenButton() {
    return isEmbedHtmlBlock(this.model);
  }

  private get _isCardView() {
    if (isBookmarkBlock(this.model) || isEmbedLinkedDocBlock(this.model)) {
      return true;
    }
    return this._embedOptions?.viewType === 'card';
  }

  private get _isEmbedView() {
    return (
      !isBookmarkBlock(this.model) &&
      (isEmbedSyncedDocBlock(this.model) ||
        this._embedOptions?.viewType === 'embed')
    );
  }

  private get _canConvertToEmbedView() {
    const block = this._blockElement;

    // synced doc entry controlled by awareness flag
    if (!!block && isEmbedLinkedDocBlock(block.model)) {
      const isSyncedDocEnabled = block.doc.awarenessStore.getFlag(
        'enable_synced_doc_block'
      );
      if (!isSyncedDocEnabled) {
        return false;
      }
    }

    return (
      (block && 'convertToEmbed' in block) ||
      this._embedOptions?.viewType === 'embed'
    );
  }

  private get _canShowCardStylePanel() {
    return (
      isBookmarkBlock(this.model) ||
      isEmbedGithubBlock(this.model) ||
      isEmbedLinkedDocBlock(this.model)
    );
  }

  private get _getCardStyleOptions(): {
    style: EmbedCardStyle;
    Icon: TemplateResult<1>;
    tooltip: string;
  }[] {
    const {
      EmbedCardHorizontalIcon,
      EmbedCardListIcon,
      EmbedCardVerticalIcon,
      EmbedCardCubeIcon,
    } = getEmbedCardIcons();
    return [
      {
        style: 'horizontal',
        Icon: EmbedCardHorizontalIcon,
        tooltip: 'Large horizontal style',
      },
      {
        style: 'list',
        Icon: EmbedCardListIcon,
        tooltip: 'Small horizontal style',
      },
      {
        style: 'vertical',
        Icon: EmbedCardVerticalIcon,
        tooltip: 'Large vertical style',
      },
      {
        style: 'cube',
        Icon: EmbedCardCubeIcon,
        tooltip: 'Small vertical style',
      },
    ];
  }

  private get _pageIcon() {
    if (
      !isEmbedLinkedDocBlock(this.model) &&
      !isEmbedSyncedDocBlock(this.model)
    ) {
      return nothing;
    }
    const block = this._blockElement as
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent;

    return block.editorMode === 'page' ? EmbedPageIcon : EmbedEdgelessIcon;
  }

  private get _docTitle() {
    if (
      !isEmbedLinkedDocBlock(this.model) &&
      !isEmbedSyncedDocBlock(this.model)
    ) {
      return '';
    }
    const block = this._blockElement as
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent;
    return block.docTitle;
  }

  private get _embedViewButtonDisabled() {
    if (this._doc.readonly) {
      return true;
    }
    return (
      isEmbedLinkedDocBlock(this.model) &&
      (!!this._blockElement?.closest('affine-embed-synced-doc-block') ||
        this.model.pageId === this._doc.id)
    );
  }

  get _openButtonDisabled() {
    return (
      isEmbedLinkedDocBlock(this.model) && this.model.pageId === this._doc.id
    );
  }

  static override styles = css`
    .change-embed-card-button {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .change-embed-card-button svg {
      width: 20px;
      height: 20px;
    }

    .change-embed-card-button.url {
      display: flex;
      width: 180px;
      padding: var(--1, 0px);
      align-items: flex-start;
      gap: 10px;
      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
      margin-right: 6px;
      user-select: none;
      cursor: pointer;
    }

    .change-embed-card-button.url > span {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      color: var(--affine-link-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      text-overflow: ellipsis;
      overflow: hidden;
      opacity: var(--add, 1);
    }

    .change-embed-card-button.doc-info {
      display: flex;
      align-items: center;
      width: max-content;
      max-width: 180px;
      padding: var(--1, 0px);

      gap: 4px;
      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
      user-select: none;
      cursor: pointer;
    }

    .change-embed-card-button.doc-info > svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .change-embed-card-button.doc-info > span {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      color: var(--affine-text-primary-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      word-break: break-all;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      text-overflow: ellipsis;
      overflow: hidden;
      opacity: var(--add, 1);
    }

    .change-embed-card-view-style {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .change-embed-card-button-view-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 2px;
      border-radius: 6px;
      background: var(--affine-hover-color);
    }
    .change-embed-card-button-view-selector .change-embed-card-button {
      width: 24px;
      height: 24px;
    }
    .change-embed-card-button-view-selector > icon-button {
      padding: 0px;
    }
    .change-embed-card-button-view-selector .current-view {
      background: var(--affine-background-overlay-panel-color);
      border-radius: 6px;
    }

    .embed-scale-button {
      display: flex;
      align-items: center;
      border-radius: 4px;
      background-color: var(--affine-hover-color);
      gap: 2px;
      line-height: 24px;
    }
  `;

  @state()
  private accessor _embedScale = 1;

  private _embedOptions: EmbedOptions | null = null;

  @property({ attribute: false })
  accessor model!:
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedFigmaModel
    | EmbedLinkedDocModel
    | EmbedSyncedDocModel
    | EmbedHtmlModel
    | EmbedLoomModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor quickConnectButton!: TemplateResult<1>;

  private _open = () => {
    this._blockElement?.open();
  };

  private _peek = () => {
    if (!this._blockElement) return;
    peek(this._blockElement);
  };

  private _showCaption() {
    this._blockElement?.captionEditor.show();
  }

  private _copyUrl = () => {
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast(this.std.host as EditorHost, 'Copied link to clipboard');
    this.edgeless.service.selection.clear();
  };

  private _setCardStyle(style: EmbedCardStyle) {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });
  }

  private _convertToCardView = () => {
    if (this._isCardView) {
      return;
    }

    const block = this._blockElement;
    if (block && 'convertToCard' in block) {
      block.convertToCard();
      return;
    }

    if (!('url' in this.model)) {
      return;
    }

    const { id, url, xywh, style, caption } = this.model;

    let targetFlavour = 'affine:bookmark',
      targetStyle = style;

    if (this._embedOptions && this._embedOptions.viewType === 'card') {
      const { flavour, styles } = this._embedOptions;
      targetFlavour = flavour;
      targetStyle = styles.includes(style) ? style : styles[0];
    } else {
      targetStyle = BookmarkStyles.includes(style) ? style : BookmarkStyles[0];
    }

    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[targetStyle];
    bound.h = EMBED_CARD_HEIGHT[targetStyle];

    const newId = this.edgeless.service.addBlock(
      targetFlavour,
      { url, xywh: bound.serialize(), style: targetStyle, caption },
      this.edgeless.surface.model
    );

    this.std.command.exec('reassociateConnectors', {
      oldId: id,
      newId,
    });

    this.edgeless.service.selection.set({
      editing: false,
      elements: [newId],
    });
    this._doc.deleteBlock(this.model);
  };

  private _convertToEmbedView = () => {
    if (this._isEmbedView) {
      return;
    }

    const block = this._blockElement;
    if (block && 'convertToEmbed' in block) {
      block.convertToEmbed();
      return;
    }

    if (!('url' in this.model)) {
      return;
    }

    if (!this._embedOptions) return;

    const { flavour, styles } = this._embedOptions;

    const { id, url, xywh, style } = this.model;

    const targetStyle = styles.includes(style) ? style : styles[0];

    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[targetStyle];
    bound.h = EMBED_CARD_HEIGHT[targetStyle];

    const newId = this.edgeless.service.addBlock(
      flavour,
      {
        url,
        xywh: bound.serialize(),
        style: targetStyle,
      },
      this.edgeless.surface.model
    );

    this.std.command.exec('reassociateConnectors', {
      oldId: id,
      newId,
    });

    this.edgeless.service.selection.set({
      editing: false,
      elements: [newId],
    });
    this._doc.deleteBlock(this.model);
  };

  private _getScale = () => {
    if (isEmbedSyncedDocBlock(this.model)) {
      return this.model.scale ?? 1;
    } else if (isEmbedHtmlBlock(this.model)) {
      return 1;
    }

    const bound = Bound.deserialize(this.model.xywh);
    return bound.h / EMBED_CARD_HEIGHT[this.model.style];
  };

  private _setEmbedScale(scale: number) {
    if (isEmbedHtmlBlock(this.model)) return;

    const bound = Bound.deserialize(this.model.xywh);
    if (isEmbedSyncedDocBlock(this.model)) {
      const oldScale = this.model.scale ?? 1;
      const ratio = scale / oldScale;
      bound.w *= ratio;
      bound.h *= ratio;
      const xywh = bound.serialize();
      this.model.doc.updateBlock(this.model, { scale, xywh });
    } else {
      bound.h = EMBED_CARD_HEIGHT[this.model.style] * scale;
      bound.w = EMBED_CARD_WIDTH[this.model.style] * scale;
      const xywh = bound.serialize();
      this.model.doc.updateBlock(this.model, { xywh });
    }
    this._embedScale = scale;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._embedScale = this._getScale();
  }

  override render() {
    const model = this.model;
    if ('url' in this.model) {
      this._embedOptions = this._rootService.getEmbedBlockOptions(
        this.model.url
      );
    }

    const buttons = [
      this._canShowUrlOptions && 'url' in model
        ? html`
            <div class="change-embed-card-button url" @click=${this._copyUrl}>
              <span>${model.url}</span>
            </div>

            <edgeless-tool-icon-button
              arai-label="Click to copy link"
              .tooltip=${'Click to copy link'}
              class="change-embed-card-button copy"
              ?disabled=${this._doc.readonly}
              @click=${this._copyUrl}
            >
              ${CopyIcon}
            </edgeless-tool-icon-button>

            <edgeless-tool-icon-button
              arai-label="Edit"
              .tooltip=${'Edit'}
              class="change-embed-card-button edit"
              ?disabled=${this._doc.readonly}
              @click=${() =>
                toggleEmbedCardEditModal(this.std.host as EditorHost, model)}
            >
              ${EditIcon}
            </edgeless-tool-icon-button>
          `
        : nothing,

      isEmbedSyncedDocBlock(model)
        ? html`
            <div class="change-embed-card-button doc-info" @click=${this._open}>
              ${this._pageIcon}
              <span>${this._docTitle}</span>
            </div>
          `
        : nothing,

      isEmbedSyncedDocBlock(model) || isEmbedLinkedDocBlock(model)
        ? html`
            <edgeless-tool-icon-button
              arai-label="Open"
              .tooltip=${'Open this doc'}
              class="change-embed-card-button open"
              @click=${this._open}
              .disabled=${this._openButtonDisabled}
            >
              ${OpenIcon}
            </edgeless-tool-icon-button>
          `
        : nothing,

      this._blockElement && isPeekable(this._blockElement)
        ? html`
            <edgeless-tool-icon-button
              arai-label="Center peek"
              .tooltip=${'Open in center peek'}
              class="change-embed-card-button center-peek"
              @click=${this._peek}
            >
              ${CenterPeekIcon}
            </edgeless-tool-icon-button>
          `
        : nothing,

      this._canShowFullScreenButton
        ? html`
            <edgeless-tool-icon-button
              arai-label="Full screen"
              .tooltip=${'Full screen'}
              class="change-embed-card-button expand"
              @click=${this._open}
            >
              ${ExpandFullIcon}
            </edgeless-tool-icon-button>
          `
        : nothing,

      this._canConvertToEmbedView || this._isEmbedView
        ? html`
            <div class="change-embed-card-view-style">
              <div class="change-embed-card-button-view-selector">
                <edgeless-tool-icon-button
                  class=${classMap({
                    'change-embed-card-button': true,
                    card: true,
                    'current-view': this._isCardView,
                  })}
                  arai-label="Card view"
                  .tooltip=${'Card view'}
                  ?disabled=${this._doc.readonly}
                  .hover=${false}
                  @click=${this._convertToCardView}
                >
                  ${BookmarkIcon}
                </edgeless-tool-icon-button>

                <edgeless-tool-icon-button
                  class=${classMap({
                    'change-embed-card-button': true,
                    embed: true,
                    'current-view': this._isEmbedView,
                  })}
                  arai-label="Embed view"
                  .tooltip=${'Embed view'}
                  .disabled=${this._embedViewButtonDisabled}
                  .hover=${false}
                  @click=${this._convertToEmbedView}
                >
                  ${EmbedWebIcon}
                </edgeless-tool-icon-button>
              </div>
            </div>
          `
        : nothing,

      'style' in model && this._canShowCardStylePanel
        ? html`
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
                .value=${model.style}
                .options=${this._getCardStyleOptions}
                .onSelect=${(value: EmbedCardStyle) =>
                  this._setCardStyle(value)}
              >
              </card-style-panel>
            </edgeless-menu-button>
          `
        : nothing,

      html`
        <edgeless-tool-icon-button
          arai-label="Add caption"
          .tooltip=${'Add caption'}
          class="change-embed-card-button caption"
          ?disabled=${this._doc.readonly}
          @click=${this._showCaption}
        >
          ${CaptionIcon}
        </edgeless-tool-icon-button>
      `,

      this.quickConnectButton,

      isEmbedHtmlBlock(model)
        ? nothing
        : html`
            <edgeless-menu-button
              .contentPadding=${'8px'}
              .button=${html`
                <edgeless-tool-icon-button
                  aria-label="Scale"
                  .tooltip=${'Scale'}
                  .justify=${'space-between'}
                  .iconContainerWidth=${'65px'}
                  .labelHeight=${'20px'}
                >
                  <span class="label ellipsis">
                    ${Math.round(this._embedScale * 100) + '%'}
                  </span>
                  ${SmallArrowDownIcon}
                </edgeless-tool-icon-button>
              `}
            >
              <edgeless-scale-panel
                slot
                class="embed-scale-popper"
                .scale=${Math.round(this._embedScale * 100)}
                .onSelect=${(scale: number) => this._setEmbedScale(scale)}
              ></edgeless-scale-panel>
            </edgeless-menu-button>
          `,
    ];

    return join(
      buttons.filter(button => button !== nothing),
      renderMenuDivider
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-embed-card-button': EdgelessChangeEmbedCardButton;
  }
}

export function renderEmbedButton(
  edgeless: EdgelessRootBlockComponent,
  models?: EdgelessChangeEmbedCardButton['model'][],
  quickConnectButton?: TemplateResult<1>[]
) {
  if (models?.length !== 1) return nothing;

  return html`
    <edgeless-change-embed-card-button
      .model=${models[0]}
      .edgeless=${edgeless}
      .quickConnectButton=${quickConnectButton?.pop() ?? nothing}
    ></edgeless-change-embed-card-button>
  `;
}
