import './component-toolbar-menu-divider.js';
import '../../edgeless/components/buttons/tool-icon-button.js';
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
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
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
import { createButtonPopper } from '../../../_common/utils/button-popper.js';
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
import { Bound, type EdgelessBlockType } from '../../../surface-block/index.js';
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
  static override styles = css`
    .change-embed-card-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

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

    component-toolbar-menu-divider {
      height: 24px;
    }

    .embed-scale-button {
      display: flex;
      border-radius: 4px;
      align-items: center;
      gap: 2px;
      padding: 2px;
      font-size: var(--affine-font-sm);
      font-weight: 500;
      color: var(--affine-text-secondary-color);
      height: 26px;
    }

    .embed-scale-label {
      display: flex;
      padding: 2px 0px 2px 4px;
      align-items: center;
    }

    card-style-panel,
    edgeless-scale-panel {
      display: none;
    }
    card-style-panel[data-show],
    edgeless-scale-panel[data-show] {
      display: flex;
    }
  `;

  @property({ attribute: false })
  model!:
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedFigmaModel
    | EmbedLinkedDocModel
    | EmbedSyncedDocModel
    | EmbedHtmlModel
    | EmbedLoomModel;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _embedScale = 1;

  @state()
  private _showCardStylePopper = false;
  @query('.change-embed-card-button.card-style')
  private _cardStyleButton!: HTMLDivElement;
  @query('card-style-panel')
  private _cardStylePanel!: HTMLDivElement;
  private _cardStylePopper: ReturnType<typeof createButtonPopper> | null = null;

  @state()
  private _showEmbedScalePopper = false;
  @query('.embed-scale-button')
  private _embedScaleButton!: HTMLDivElement;
  @query('edgeless-scale-panel')
  private _embedScalePanel!: HTMLDivElement;
  private _embedScalePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private get _doc() {
    return this.model.doc;
  }

  private get std() {
    return this.edgeless.std;
  }

  private _embedOptions: EmbedOptions | null = null;

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private get _blockElement() {
    const blockSelection = this.edgeless.service.selection.selections.filter(
      sel => sel.elements.includes(this.model.id)
    );
    if (blockSelection.length !== 1) {
      return;
    }

    const blockElement = this.std.view.viewFromPath(
      'block',
      blockSelection[0].path
    ) as
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

  private _open() {
    this._blockElement?.open();
  }

  private _showCaption() {
    this._blockElement?.captionElement?.show();
  }

  private _copyUrl() {
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast(this.std.host as EditorHost, 'Copied link to clipboard');
    this.edgeless.service.selection.clear();
  }

  private _setCardStyle(style: EmbedCardStyle) {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.doc.updateBlock(this.model, { style, xywh });
    this._cardStylePopper?.hide();
  }

  private _convertToCardView() {
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

    const { url, xywh, style, caption } = this.model;

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

    const blockId = this.edgeless.service.addBlock(
      targetFlavour as EdgelessBlockType,
      { url, xywh: bound.serialize(), style: targetStyle, caption },
      this.edgeless.surface.model
    );
    this.edgeless.service.selection.set({
      editing: false,
      elements: [blockId],
    });
    this._doc.deleteBlock(this.model);
  }

  private _convertToEmbedView() {
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

    const { url, xywh, style } = this.model;

    const targetStyle = styles.includes(style) ? style : styles[0];

    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[targetStyle];
    bound.h = EMBED_CARD_HEIGHT[targetStyle];

    const blockId = this.edgeless.service.addBlock(
      flavour as EdgelessBlockType,
      {
        url,
        xywh: bound.serialize(),
        style: targetStyle,
      },
      this.edgeless.surface.model
    );

    this.edgeless.service.selection.set({
      editing: false,
      elements: [blockId],
    });
    this._doc.deleteBlock(this.model);
  }

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

  override updated(changedProperties: Map<string, unknown>) {
    this._cardStylePopper?.dispose();
    if (this._canShowCardStylePanel) {
      this._cardStylePopper = createButtonPopper(
        this._cardStyleButton,
        this._cardStylePanel,
        ({ display }) => {
          this._showCardStylePopper = display === 'show';
        }
      );
      this._disposables.add(this._cardStylePopper);
    }

    if (!isEmbedHtmlBlock(this.model)) {
      this._embedScalePopper = createButtonPopper(
        this._embedScaleButton,
        this._embedScalePanel,
        ({ display }) => {
          this._showEmbedScalePopper = display === 'show';
        }
      );
      this._disposables.add(this._embedScalePopper);
    }

    super.updated(changedProperties);
  }

  override render() {
    const model = this.model;
    if ('url' in this.model) {
      this._embedOptions = this._rootService.getEmbedBlockOptions(
        this.model.url
      );
    }

    return html`
      <div class="change-embed-card-container">
        ${this._canShowUrlOptions && 'url' in model
          ? html`
              <div class="change-embed-card-button url" @click=${this._copyUrl}>
                <span>${model.url}</span>
              </div>

              <edgeless-tool-icon-button
                .tooltip=${'Click to copy link'}
                .iconContainerPadding=${2}
                class="change-embed-card-button copy"
                ?disabled=${this._doc.readonly}
                @click=${this._copyUrl}
              >
                ${CopyIcon}
              </edgeless-tool-icon-button>

              <edgeless-tool-icon-button
                .tooltip=${'Edit'}
                .iconContainerPadding=${2}
                class="change-embed-card-button edit"
                ?disabled=${this._doc.readonly}
                @click=${() =>
                  toggleEmbedCardEditModal(this.std.host as EditorHost, model)}
              >
                ${EditIcon}
              </edgeless-tool-icon-button>

              <component-toolbar-menu-divider
                .vertical=${true}
              ></component-toolbar-menu-divider>
            `
          : nothing}
        ${isEmbedLinkedDocBlock(model) || isEmbedSyncedDocBlock(model)
          ? html`
              ${isEmbedSyncedDocBlock(model)
                ? html`<div
                    class="change-embed-card-button doc-info"
                    @click=${this._open}
                  >
                    ${this._pageIcon}
                    <span>${this._docTitle}</span>
                  </div>`
                : nothing}
              <edgeless-tool-icon-button
                .tooltip=${'Open'}
                .iconContainerPadding=${2}
                class="change-embed-card-button open"
                @click=${this._open}
              >
                ${OpenIcon}
              </edgeless-tool-icon-button>

              <component-toolbar-menu-divider
                .vertical=${true}
              ></component-toolbar-menu-divider>
            `
          : nothing}
        ${this._canShowFullScreenButton
          ? html`
              <edgeless-tool-icon-button
                .tooltip=${'Full screen'}
                .iconContainerPadding=${2}
                class="change-embed-card-button expand"
                @click=${this._open}
              >
                ${ExpandFullIcon}
              </edgeless-tool-icon-button>

              <component-toolbar-menu-divider
                .vertical=${true}
              ></component-toolbar-menu-divider>
            `
          : nothing}
        ${this._canConvertToEmbedView || this._isEmbedView
          ? html`
              <div class="change-embed-card-view-style">
                <div class="change-embed-card-button-view-selector">
                  <edgeless-tool-icon-button
                    class=${classMap({
                      'change-embed-card-button': true,
                      card: true,
                      'current-view': this._isCardView,
                    })}
                    .tooltip=${'Card view'}
                    ?disabled=${this._doc.readonly}
                    .iconContainerPadding=${2}
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
                    .tooltip=${'Embed view'}
                    ?disabled=${this._doc.readonly}
                    .iconContainerPadding=${2}
                    .hover=${false}
                    @click=${this._convertToEmbedView}
                  >
                    ${EmbedWebIcon}
                  </edgeless-tool-icon-button>
                </div>
              </div>
            `
          : nothing}
        ${'style' in model && this._canShowCardStylePanel
          ? html`
              <div class="change-embed-card-button card-style">
                <edgeless-tool-icon-button
                  .tooltip=${this._showCardStylePopper ? nothing : 'Card style'}
                  .iconContainerPadding=${2}
                  ?disabled=${this._doc.readonly}
                  @click=${() => this._cardStylePopper?.toggle()}
                >
                  ${PaletteIcon}
                </edgeless-tool-icon-button>

                <card-style-panel
                  .value=${model.style}
                  .options=${this._getCardStyleOptions}
                  .onSelect=${(value: EmbedCardStyle) =>
                    this._setCardStyle(value)}
                >
                </card-style-panel>
              </div>
            `
          : nothing}

        <component-toolbar-menu-divider
          .vertical=${true}
        ></component-toolbar-menu-divider>

        <edgeless-tool-icon-button
          .tooltip=${'Add Caption'}
          .iconContainerPadding=${2}
          class="change-embed-card-button caption"
          ?disabled=${this._doc.readonly}
          @click=${this._showCaption}
        >
          ${CaptionIcon}
        </edgeless-tool-icon-button>

        ${!isEmbedHtmlBlock(model)
          ? html`<component-toolbar-menu-divider
                .vertical=${true}
              ></component-toolbar-menu-divider>

              <edgeless-tool-icon-button
                .tooltip=${this._showEmbedScalePopper ? nothing : 'Scale'}
                .iconContainerPadding=${0}
                @click=${() => this._embedScalePopper?.toggle()}
              >
                <div class="embed-scale-button">
                  <span class="embed-scale-label"
                    >${Math.round(this._embedScale * 100) + '%'}</span
                  >
                  ${SmallArrowDownIcon}
                </div>
              </edgeless-tool-icon-button>
              <edgeless-scale-panel
                class="embed-scale-popper"
                .scale=${Math.round(this._embedScale * 100)}
                .scales=${[50, 100, 200]}
                .minSize=${0}
                .onSelect=${(scale: number) => {
                  this._setEmbedScale(scale);
                }}
                .onPopperCose=${() => this._embedScalePopper?.hide()}
              ></edgeless-scale-panel>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-embed-card-button': EdgelessChangeEmbedCardButton;
  }
}

export function renderEmbedButton(
  edgeless: EdgelessRootBlockComponent,
  models?: EdgelessChangeEmbedCardButton['model'][]
) {
  if (models?.length !== 1) return nothing;

  return html`
    <edgeless-change-embed-card-button
      .model=${models[0]}
      .edgeless=${edgeless}
    ></edgeless-change-embed-card-button>
  `;
}
