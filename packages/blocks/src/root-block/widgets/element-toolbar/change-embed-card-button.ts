import type { BlockStdScope } from '@blocksuite/block-std';

import { getDocContentWithMaxLength } from '@blocksuite/affine-block-embed';
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
import { notifyLinkedDocSwitchedToEmbed } from '@blocksuite/affine-components/notification';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type MenuItem,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import { type AliasInfo, BookmarkStyles } from '@blocksuite/affine-model';
import {
  EmbedOptionProvider,
  type EmbedOptions,
  GenerateDocUrlProvider,
  type GenerateDocUrlService,
  type LinkEventType,
  type TelemetryEvent,
  TelemetryProvider,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import { getHostName, referenceToNode } from '@blocksuite/affine-shared/utils';
import { Bound, WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type {
  EmbedBlockComponent,
  EmbedModel,
} from '../../../_common/components/embed-card/type.js';
import type { EmbedCardStyle } from '../../../_common/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import { isInternalEmbedModel } from '../../../_common/components/embed-card/type.js';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedHtmlBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../edgeless/utils/query.js';

export class EdgelessChangeEmbedCardButton extends WithDisposable(LitElement) {
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

    editor-icon-button.doc-title .label {
      max-width: 110px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
  `;

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
      const referenceInfo = block.referenceInfo$.peek();

      block.convertToEmbed();

      if (referenceInfo.title || referenceInfo.description)
        notifyLinkedDocSwitchedToEmbed(this.std);

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
    let url!: ReturnType<GenerateDocUrlService['generateDocUrl']>;

    if ('url' in this.model) {
      url = this.model.url;
    } else if (isInternalEmbedModel(this.model)) {
      url = this.std
        .getOptional(GenerateDocUrlProvider)
        ?.generateDocUrl(this.model.pageId, this.model.params);
    }

    if (!url) return;

    navigator.clipboard.writeText(url).catch(console.error);
    toast(this.std.host, 'Copied link to clipboard');
    this.edgeless.service.selection.clear();

    track(this.std, this.model, this._viewType, 'CopiedLink', {
      control: 'copy link',
    });
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

  private _openEditPopup = (e: MouseEvent) => {
    e.stopPropagation();

    if (isEmbedHtmlBlock(this.model)) return;

    this.std.selection.clear();

    const originalDocInfo = this._originalDocInfo;

    toggleEmbedCardEditModal(
      this.std.host,
      this.model,
      this._viewType,
      originalDocInfo
    );

    track(this.std, this.model, this._viewType, 'OpenedAliasPopup', {
      control: 'edit',
    });
  };

  private _peek = () => {
    if (!this._blockComponent) return;
    peek(this._blockComponent);
  };

  private _setCardStyle = (style: EmbedCardStyle) => {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });

    track(this.std, this.model, this._viewType, 'SelectedCardStyle', {
      control: 'select card style',
      type: style,
    });
  };

  private _setEmbedScale = (scale: number) => {
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

    track(this.std, this.model, this._viewType, 'SelectedCardScale', {
      control: 'select card scale',
      type: `${scale}`,
    });
  };

  private _toggleCardScaleSelector = (e: Event) => {
    const opened = (e as CustomEvent<boolean>).detail;
    if (!opened) return;

    track(this.std, this.model, this._viewType, 'OpenedCardScaleSelector', {
      control: 'switch card scale',
    });
  };

  private _toggleCardStyleSelector = (e: Event) => {
    const opened = (e as CustomEvent<boolean>).detail;
    if (!opened) return;

    track(this.std, this.model, this._viewType, 'OpenedCardStyleSelector', {
      control: 'switch card style',
    });
  };

  private _toggleViewSelector = (e: Event) => {
    const opened = (e as CustomEvent<boolean>).detail;
    if (!opened) return;

    track(this.std, this.model, this._viewType, 'OpenedViewSelector', {
      control: 'switch view',
    });
  };

  private _trackViewSelected = (type: string) => {
    track(this.std, this.model, this._viewType, 'SelectedView', {
      control: 'select view',
      type: `${type} view`,
    });
  };

  private get _blockComponent() {
    const blockSelection =
      this.edgeless.service.selection.surfaceSelections.filter(sel =>
        sel.elements.includes(this.model.id)
      );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockComponent = this.std.view.getBlock(
      blockSelection[0].blockId
    ) as EmbedBlockComponent | null;

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
      (referenceToNode(this.model) ||
        !!this._blockComponent?.closest('affine-embed-synced-doc-block') ||
        this.model.pageId === this._doc.id)
    );
  }

  private get _getCardStyleOptions(): {
    style: EmbedCardStyle;
    Icon: TemplateResult<1>;
    tooltip: string;
  }[] {
    const theme = this.std.get(ThemeProvider).theme;
    const {
      EmbedCardHorizontalIcon,
      EmbedCardListIcon,
      EmbedCardVerticalIcon,
      EmbedCardCubeIcon,
    } = getEmbedCardIcons(theme);
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

  get _originalDocInfo(): AliasInfo | undefined {
    const model = this.model;
    const doc = isInternalEmbedModel(model)
      ? this.std.collection.getDoc(model.pageId)
      : null;

    if (doc) {
      const title = doc.meta?.title;
      const description = isEmbedLinkedDocBlock(model)
        ? getDocContentWithMaxLength(doc)
        : undefined;
      return { title, description };
    }

    return undefined;
  }

  get _originalDocTitle() {
    const model = this.model;
    const doc = isInternalEmbedModel(model)
      ? this.std.collection.getDoc(model.pageId)
      : null;

    return doc?.meta?.title || 'Untitled';
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

  private _openMenuButton() {
    const buttons: MenuItem[] = [];

    if (
      isEmbedLinkedDocBlock(this.model) ||
      isEmbedSyncedDocBlock(this.model)
    ) {
      buttons.push({
        type: 'open-this-doc',
        label: 'Open this doc',
        icon: ExpandFullSmallIcon,
        action: this._open,
        disabled: this._openButtonDisabled,
      });
    } else if (this._canShowFullScreenButton) {
      buttons.push({
        type: 'open-this-doc',
        label: 'Open this doc',
        icon: ExpandFullSmallIcon,
        action: this._open,
      });
    }

    // open in new tab

    if (this._blockComponent && isPeekable(this._blockComponent)) {
      buttons.push({
        type: 'open-in-center-peek',
        label: 'Open in center peek',
        icon: CenterPeekIcon,
        action: () => this._peek(),
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
            button => button.label,
            ({ label, icon, action, disabled }) => html`
              <editor-menu-action
                aria-label=${ifDefined(label)}
                ?disabled=${disabled}
                @click=${action}
              >
                ${icon}<span class="label">${label}</span>
              </editor-menu-action>
            `
          )}
        </div>
      </editor-menu-button>
    `;
  }

  private _showCaption() {
    this._blockComponent?.captionEditor?.show();

    track(this.std, this.model, this._viewType, 'OpenedCaptionEditor', {
      control: 'add caption',
    });
  }

  private _viewSelector() {
    if (this._canConvertToEmbedView || this._isEmbedView) {
      const buttons = [
        {
          type: 'card',
          label: 'Card view',
          action: () => this._convertToCardView(),
          disabled: this.model.doc.readonly,
        },
        {
          type: 'embed',
          label: 'Embed view',
          action: () => this._convertToEmbedView(),
          disabled: this.model.doc.readonly || this._embedViewButtonDisabled,
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
          @toggle=${this._toggleViewSelector}
        >
          <div data-size="small" data-orientation="vertical">
            ${repeat(
              buttons,
              button => button.type,
              ({ type, label, action, disabled }) => html`
                <editor-menu-action
                  data-testid=${`link-to-${type}`}
                  aria-label=${ifDefined(label)}
                  ?data-selected=${this._viewType === type}
                  ?disabled=${disabled || this._viewType === type}
                  @click=${() => {
                    action();
                    this._trackViewSelected(type);
                  }}
                >
                  ${label}
                </editor-menu-action>
              `
            )}
          </div>
        </editor-menu-button>
      `;
    }

    return nothing;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._embedScale = this._getScale();
  }

  override render() {
    const model = this.model;
    const isHtmlBlockModel = isEmbedHtmlBlock(model);

    if ('url' in this.model) {
      this._embedOptions = this.std
        .get(EmbedOptionProvider)
        .getEmbedBlockOptions(this.model.url);
    }

    const buttons = [
      this._openMenuButton(),

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
          `
        : nothing,

      // internal embed model
      isEmbedLinkedDocBlock(model) && model.title
        ? html`
            <editor-icon-button
              class="doc-title"
              aria-label="Doc title"
              .hover=${false}
              .labelHeight=${'20px'}
              .tooltip=${this._originalDocTitle}
              @click=${this._open}
            >
              <span class="label">${this._originalDocTitle}</span>
            </editor-icon-button>
          `
        : nothing,

      isHtmlBlockModel
        ? nothing
        : html`
            <editor-icon-button
              aria-label="Click link"
              .tooltip=${'Click link'}
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
              @click=${this._openEditPopup}
            >
              ${EditIcon}
            </editor-icon-button>
          `,

      this._viewSelector(),

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
              @toggle=${this._toggleCardStyleSelector}
            >
              <card-style-panel
                .value=${model.style}
                .options=${this._getCardStyleOptions}
                .onSelect=${this._setCardStyle}
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

      isHtmlBlockModel
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
              @toggle=${this._toggleCardScaleSelector}
            >
              <edgeless-scale-panel
                class="embed-scale-popper"
                .scale=${Math.round(this._embedScale * 100)}
                .onSelect=${this._setEmbedScale}
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
  accessor model!: EmbedModel;

  @property({ attribute: false })
  accessor quickConnectButton!: TemplateResult<1> | typeof nothing;
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

function track(
  std: BlockStdScope,
  model: EmbedModel,
  viewType: string,
  event: LinkEventType,
  props: Partial<TelemetryEvent>
) {
  std.getOptional(TelemetryProvider)?.track(event, {
    segment: 'toolbar',
    page: 'whiteboard editor',
    module: 'element toolbar',
    type: `${viewType} view`,
    category: isInternalEmbedModel(model) ? 'linked doc' : 'link',
    ...props,
  });
}
