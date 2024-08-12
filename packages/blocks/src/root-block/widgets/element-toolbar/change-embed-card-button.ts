import type {
  BookmarkBlockModel,
  EmbedFigmaModel,
  EmbedGithubModel,
  EmbedHtmlModel,
  EmbedLinkedDocModel,
  EmbedLoomModel,
  EmbedSyncedDocModel,
  EmbedYoutubeModel,
} from '@blocksuite/affine-model';

import {
  CaptionIcon,
  CenterPeekIcon,
  CopyIcon,
  EditIcon,
  ExpandFullSmallIcon,
  OpenIcon,
  PaletteIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type Action,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import { BookmarkStyles } from '@blocksuite/affine-model';
import { getHostName } from '@blocksuite/affine-shared/utils';
import { WithDisposable } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';
import { LitElement, type TemplateResult, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EmbedCardStyle } from '../../../_common/types.js';
import type { BookmarkBlockComponent } from '../../../bookmark-block/index.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/index.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/index.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/index.js';
import type { EmbedLoomBlockComponent } from '../../../embed-loom-block/index.js';
import type { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/index.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EmbedOptions } from '../../root-service.js';

import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import '../../edgeless/components/panel/card-style-panel.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedHtmlBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../edgeless/utils/query.js';

@customElement('edgeless-change-embed-card-button')
export class EdgelessChangeEmbedCardButton extends WithDisposable(LitElement) {
  private _convertToCardView = () => {
    if (this._isCardView) {
      return;
    }

    const block = this._blockComponent;
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

    const block = this._blockComponent;
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

  private _copyUrl = () => {
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast(this.std.host, 'Copied link to clipboard');
    this.edgeless.service.selection.clear();
  };

  private _embedOptions: EmbedOptions | null = null;

  private _getScale = () => {
    if ('scale' in this.model) {
      return this.model.scale ?? 1;
    } else if (isEmbedHtmlBlock(this.model)) {
      return 1;
    }

    const bound = Bound.deserialize(this.model.xywh);
    return bound.h / EMBED_CARD_HEIGHT[this.model.style];
  };

  private _open = () => {
    this._blockComponent?.open();
  };

  private _peek = () => {
    if (!this._blockComponent) return;
    peek(this._blockComponent);
  };

  static override styles = css`
    .affine-link-preview {
      display: flex;
      justify-content: flex-start;
      width: 140px;
      padding: var(--1, 0px);
      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
      user-select: none;
      cursor: pointer;

      color: var(--affine-link-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-sm);
      font-style: normal;
      font-weight: 400;
      text-decoration: none;
      text-wrap: nowrap;
    }

    .affine-link-preview > span {
      display: inline-block;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      text-overflow: ellipsis;
      overflow: hidden;
      opacity: var(--add, 1);
    }
  `;

  private get _blockComponent() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockComponent = this.std.view.getBlock(blockSelection[0].blockId) as
      | BookmarkBlockComponent
      | EmbedGithubBlockComponent
      | EmbedYoutubeBlockComponent
      | EmbedFigmaBlockComponent
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent
      | EmbedLoomBlockComponent
      | null;

    if (!blockComponent) return;

    return blockComponent;
  }

  private get _canConvertToEmbedView() {
    const block = this._blockComponent;

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

  private get _canShowFullScreenButton() {
    return isEmbedHtmlBlock(this.model);
  }

  private get _canShowUrlOptions() {
    return (
      'url' in this.model &&
      (isBookmarkBlock(this.model) ||
        isEmbedGithubBlock(this.model) ||
        isEmbedLinkedDocBlock(this.model))
    );
  }

  private get _doc() {
    return this.model.doc;
  }

  private get _embedViewButtonDisabled() {
    if (this._doc.readonly) {
      return true;
    }
    return (
      isEmbedLinkedDocBlock(this.model) &&
      (!!this._blockComponent?.closest('affine-embed-synced-doc-block') ||
        this.model.pageId === this._doc.id)
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

  get _openButtonDisabled() {
    return (
      isEmbedLinkedDocBlock(this.model) && this.model.pageId === this._doc.id
    );
  }

  private _openMenuButton() {
    const buttons: Action[] = [];

    if (
      isEmbedLinkedDocBlock(this.model) ||
      isEmbedSyncedDocBlock(this.model)
    ) {
      buttons.push({
        name: 'Open this doc',
        icon: ExpandFullSmallIcon,
        handler: this._open,
        disabled: this._openButtonDisabled,
      });
    } else if (this._canShowFullScreenButton) {
      buttons.push({
        name: 'Open this doc',
        icon: ExpandFullSmallIcon,
        handler: this._open,
      });
    }

    // open in new tab

    if (this._blockComponent && isPeekable(this._blockComponent)) {
      buttons.push({
        name: 'Open in center peek',
        icon: CenterPeekIcon,
        handler: () => this._peek(),
      });
    }

    // open in split view

    if (buttons.length === 0) {
      return nothing;
    }

    return html`
      <editor-menu-button
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button
            aria-label="Open"
            .justify=${'space-between'}
            .labelHeight=${'20px'}
          >
            ${OpenIcon}${SmallArrowDownIcon}
          </editor-icon-button>
        `}
      >
        <div data-size="small" data-orientation="vertical">
          ${repeat(
            buttons,
            button => button.name,
            ({ name, icon, handler, disabled }) => html`
              <editor-menu-action
                aria-label=${name}
                ?disabled=${disabled}
                @click=${handler}
              >
                ${icon}<span class="label">${name}</span>
              </editor-menu-action>
            `
          )}
        </div>
      </editor-menu-button>
    `;
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private _setCardStyle(style: EmbedCardStyle) {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });
  }

  private _setEmbedScale(scale: number) {
    if (isEmbedHtmlBlock(this.model)) return;

    const bound = Bound.deserialize(this.model.xywh);
    if ('scale' in this.model) {
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

  private _showCaption() {
    this._blockComponent?.captionEditor?.show();
  }

  private _viewMenuButton() {
    if (this._canConvertToEmbedView || this._isEmbedView) {
      const buttons = [
        {
          type: 'card',
          name: 'Card view',
          handler: () => this._convertToCardView(),
          disabled: this.model.doc.readonly,
        },
        {
          type: 'embed',
          name: 'Embed view',
          handler: () => this._convertToEmbedView(),
          disabled: this.model.doc.readonly && this._embedViewButtonDisabled,
        },
      ];

      return html`
        <editor-menu-button
          .contentPadding=${'8px'}
          .button=${html`
            <editor-icon-button
              aria-label="Switch view"
              .justify=${'space-between'}
              .labelHeight=${'20px'}
              .iconContainerWidth=${'110px'}
            >
              <div class="label">
                <span style="text-transform: capitalize"
                  >${this._viewType}</span
                >
                view
              </div>
              ${SmallArrowDownIcon}
            </editor-icon-button>
          `}
        >
          <div data-size="small" data-orientation="vertical">
            ${repeat(
              buttons,
              button => button.type,
              ({ type, name, handler, disabled }) => html`
                <editor-menu-action
                  aria-label=${name}
                  data-testid=${`link-to-${type}`}
                  ?data-selected=${this._viewType === type}
                  ?disabled=${disabled}
                  @click=${handler}
                >
                  ${name}
                </editor-menu-action>
              `
            )}
          </div>
        </editor-menu-button>
      `;
    }

    return nothing;
  }

  private get _viewType(): 'inline' | 'embed' | 'card' {
    if (this._isCardView) {
      return 'card';
    }

    if (this._isEmbedView) {
      return 'embed';
    }

    // unreachable
    return 'inline';
  }

  private get std() {
    return this.edgeless.std;
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
            <a
              class="affine-link-preview"
              href=${model.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>${getHostName(model.url)}</span>
            </a>

            <editor-icon-button
              aria-label="Click to copy link"
              .tooltip=${'Click to copy link'}
              class="change-embed-card-button copy"
              ?disabled=${this._doc.readonly}
              @click=${this._copyUrl}
            >
              ${CopyIcon}
            </editor-icon-button>

            <editor-icon-button
              aria-label="Edit"
              .tooltip=${'Edit'}
              class="change-embed-card-button edit"
              ?disabled=${this._doc.readonly}
              @click=${() => toggleEmbedCardEditModal(this.std.host, model)}
            >
              ${EditIcon}
            </editor-icon-button>
          `
        : nothing,

      this._openMenuButton(),

      this._viewMenuButton(),

      'style' in model && this._canShowCardStylePanel
        ? html`
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
                .value=${model.style}
                .options=${this._getCardStyleOptions}
                .onSelect=${(value: EmbedCardStyle) =>
                  this._setCardStyle(value)}
              >
              </card-style-panel>
            </editor-menu-button>
          `
        : nothing,

      'caption' in model
        ? html`
            <editor-icon-button
              aria-label="Add caption"
              .tooltip=${'Add caption'}
              class="change-embed-card-button caption"
              ?disabled=${this._doc.readonly}
              @click=${this._showCaption}
            >
              ${CaptionIcon}
            </editor-icon-button>
          `
        : nothing,

      this.quickConnectButton,

      isEmbedHtmlBlock(model)
        ? nothing
        : html`
            <editor-menu-button
              .contentPadding=${'8px'}
              .button=${html`
                <editor-icon-button
                  aria-label="Scale"
                  .tooltip=${'Scale'}
                  .justify=${'space-between'}
                  .iconContainerWidth=${'65px'}
                  .labelHeight=${'20px'}
                >
                  <span class="label">
                    ${Math.round(this._embedScale * 100) + '%'}
                  </span>
                  ${SmallArrowDownIcon}
                </editor-icon-button>
              `}
            >
              <edgeless-scale-panel
                class="embed-scale-popper"
                .scale=${Math.round(this._embedScale * 100)}
                .onSelect=${(scale: number) => this._setEmbedScale(scale)}
              ></edgeless-scale-panel>
            </editor-menu-button>
          `,
    ];

    return join(
      buttons.filter(button => button !== nothing),
      renderToolbarSeparator
    );
  }

  @state()
  private accessor _embedScale = 1;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

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
  accessor quickConnectButton!: TemplateResult<1> | typeof nothing;
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
