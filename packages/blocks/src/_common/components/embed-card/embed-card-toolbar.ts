import '../tooltip/tooltip.js';

import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import { BookmarkStyles } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type {
  EmbedGithubBlockComponent,
  EmbedGithubModel,
} from '../../../embed-github-block/index.js';
import type {
  EmbedLinkedDocBlockComponent,
  EmbedLinkedDocModel,
} from '../../../embed-linked-doc-block/index.js';
import type { EmbedLoomBlockComponent } from '../../../embed-loom-block/embed-loom-block.js';
import type { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../../page-block/edgeless/utils/query.js';
import type {
  EmbedOptions,
  PageService,
} from '../../../page-block/page-service.js';
import { BookmarkIcon, MoreVerticalIcon } from '../../icons/edgeless.js';
import {
  CaptionIcon,
  CopyIcon,
  EditIcon,
  EmbedEdgelessIcon,
  EmbedPageIcon,
  EmbedWebIcon,
  LinkIcon,
  OpenIcon,
  PaletteIcon,
  RefreshIcon,
} from '../../icons/text.js';
import { createLitPortal } from '../portal.js';
import { toast } from '../toast.js';
import { EmbedCardMoreMenu } from './embed-card-more-menu-popper.js';
import { EmbedCardStyleMenu } from './embed-card-style-popper.js';
import { toggleEmbedCardCaptionEditModal } from './modal/embed-card-caption-edit-modal.js';
import { toggleEmbedCardEditModal } from './modal/embed-card-edit-modal.js';

export type EmbedToolbarBlock =
  | BookmarkBlockComponent
  | EmbedGithubBlockComponent
  | EmbedYoutubeBlockComponent
  | EmbedFigmaBlockComponent
  | EmbedLinkedDocBlockComponent
  | EmbedSyncedDocBlockComponent
  | EmbedLoomBlockComponent;

@customElement('embed-card-toolbar')
export class EmbedCardToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    .embed-card-toolbar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
      height: 40px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      user-select: none;
    }

    .embed-card-toolbar .divider {
      width: 1px;
      height: 24px;
      background-color: var(--affine-border-color);
    }

    .embed-card-toolbar-button.url {
      display: flex;
      width: 180px;
      padding: var(--1, 0px);
      align-items: flex-start;
      gap: 10px;
      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
      user-select: none;
      cursor: pointer;
    }

    .embed-card-toolbar-button.url > span {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      color: var(--affine-link-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-family: var(--affine-font-family);
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      text-overflow: ellipsis;
      overflow: hidden;
      opacity: var(--add, 1);
    }

    .embed-card-toolbar-button.page-info {
      display: flex;
      align-items: center;
      max-width: 180px;
      padding: var(--1, 0px);

      gap: 4px;
      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
      user-select: none;
      cursor: pointer;
    }

    .embed-card-toolbar-button.page-info > svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .embed-card-toolbar-button.page-info > span {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;

      color: var(--affine-text-primary-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      word-break: break-all;
      font-family: var(--affine-font-family);
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      text-overflow: ellipsis;
      overflow: hidden;
      opacity: var(--add, 1);
    }

    .embed-card-toolbar-button.view-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 2px;
      border-radius: 6px;
      background: var(--affine-hover-color);
    }
    .embed-card-toolbar-button.view-selector > icon-button {
      padding: 0px;
    }
    .embed-card-toolbar-button.view-selector .current-view {
      background: var(--affine-background-overlay-panel-color);
      border-radius: 6px;
    }
  `;

  @property({ attribute: false })
  block!: EmbedToolbarBlock;

  @property({ attribute: false })
  abortController!: AbortController;

  @query('.embed-card-toolbar')
  embedCardToolbarElement!: HTMLElement;

  @query('.embed-card-toolbar-button.card-style')
  cardStyleButton?: HTMLElement;

  private _cardStyleMenuAbortController: AbortController | null = null;

  private _moreMenuAbortController: AbortController | null = null;

  private _embedOptions: EmbedOptions | null = null;

  private get _model() {
    return this.block.model;
  }

  private get _host() {
    return this.block.host;
  }

  private get _std() {
    return this.block.std;
  }

  private get _pageService() {
    const pageService = this._std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    return pageService;
  }

  private get _canShowUrlOptions() {
    return 'url' in this._model && this._isCardView;
  }

  private get _isCardView() {
    return (
      isBookmarkBlock(this._model) ||
      isEmbedLinkedDocBlock(this._model) ||
      this._embedOptions?.viewType === 'card'
    );
  }

  private get _isEmbedView() {
    return (
      !isBookmarkBlock(this._model) &&
      (isEmbedSyncedDocBlock(this._model) ||
        this._embedOptions?.viewType === 'embed')
    );
  }

  private get _canConvertToEmbedView() {
    return (
      'convertToEmbed' in this.block || this._embedOptions?.viewType === 'embed'
    );
  }

  private _canShowCardStylePanel(
    model: BlockModel
  ): model is BookmarkBlockModel | EmbedGithubModel | EmbedLinkedDocModel {
    return (
      isBookmarkBlock(model) ||
      isEmbedGithubBlock(model) ||
      isEmbedLinkedDocBlock(model)
    );
  }

  private _copyUrl() {
    if (!('url' in this._model)) {
      return;
    }

    navigator.clipboard.writeText(this._model.url).catch(console.error);
    toast(this._host as EditorHost, 'Copied link to clipboard');
    this.remove();
  }

  private get _pageIcon() {
    if (
      !isEmbedLinkedDocBlock(this._model) &&
      !isEmbedSyncedDocBlock(this._model)
    ) {
      return nothing;
    }
    const block = this.block as
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent;

    return block.pageMode === 'page' ? EmbedPageIcon : EmbedEdgelessIcon;
  }

  private get _pageTitle() {
    if (
      !isEmbedLinkedDocBlock(this._model) &&
      !isEmbedSyncedDocBlock(this._model)
    ) {
      return '';
    }
    const block = this.block as
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent;
    return block.pageTitle;
  }

  private _turnIntoInlineView() {
    if ('covertToInline' in this.block) {
      this.block.covertToInline();
      return;
    }

    if (!('url' in this._model)) {
      return;
    }

    const { page } = this._model;
    const parent = page.getParent(this._model);
    const index = parent?.children.indexOf(this._model);

    const yText = new Workspace.Y.Text();
    const insert = this._model.title || this._model.caption || this._model.url;
    yText.insert(0, insert);
    yText.format(0, insert.length, { link: this._model.url });
    const text = new page.Text(yText);
    page.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    page.deleteBlock(this._model);
  }

  private _convertToCardView() {
    if (this._isCardView) {
      return;
    }

    if ('convertToCard' in this.block) {
      this.block.convertToCard();
      return;
    }

    if (!('url' in this._model)) {
      return;
    }

    const { page, url, style, caption } = this._model;

    let targetFlavour = 'affine:bookmark',
      targetStyle = style;

    if (this._embedOptions && this._embedOptions.viewType === 'card') {
      const { flavour, styles } = this._embedOptions;
      targetFlavour = flavour;
      targetStyle = styles.includes(style) ? style : styles[0];
    } else {
      targetStyle = BookmarkStyles.includes(style)
        ? style
        : BookmarkStyles.filter(
            style => style !== 'vertical' && style !== 'cube'
          )[0];
    }

    const parent = page.getParent(this._model);
    assertExists(parent);
    const index = parent.children.indexOf(this._model);

    page.addBlock(
      targetFlavour,
      { url, style: targetStyle, caption },
      parent,
      index
    );
    this._std.selection.setGroup('note', []);
    page.deleteBlock(this._model);
  }

  private _convertToEmbedView() {
    if (this._isEmbedView) {
      return;
    }

    if ('convertToEmbed' in this.block) {
      this.block.convertToEmbed();
      return;
    }

    if (!('url' in this._model)) {
      return;
    }

    const { page, url, style, caption } = this._model;

    if (!this._embedOptions || this._embedOptions.viewType !== 'embed') {
      return;
    }
    const { flavour, styles } = this._embedOptions;

    const targetStyle = styles.includes(style)
      ? style
      : styles.filter(style => style !== 'vertical' && style !== 'cube')[0];

    const parent = page.getParent(this._model);
    assertExists(parent);
    const index = parent.children.indexOf(this._model);

    page.addBlock(flavour, { url, style: targetStyle, caption }, parent, index);

    this._std.selection.setGroup('note', []);
    page.deleteBlock(this._model);
  }

  private _showCaption() {
    const captionElement = this.block.captionElement;
    if (captionElement) {
      captionElement.show();
    } else {
      toggleEmbedCardCaptionEditModal(this.block);
    }
    this.abortController.abort();
  }

  private _refreshData() {
    this.block.refreshData();
    this.abortController.abort();
  }

  private _toggleCardStyleMenu() {
    if (this._moreMenuAbortController) {
      this._moreMenuAbortController.abort();
      this._moreMenuAbortController = null;
    }
    if (this._cardStyleMenuAbortController) {
      this._cardStyleMenuAbortController.abort();
      this._cardStyleMenuAbortController = null;
      return;
    }
    if (!this._canShowCardStylePanel(this._model)) {
      return;
    }
    this._cardStyleMenuAbortController = new AbortController();
    const embedCardStyleMenu = new EmbedCardStyleMenu();
    embedCardStyleMenu.model = this._model;
    embedCardStyleMenu.abortController = this.abortController;

    const referenceElement = this.cardStyleButton;
    assertExists(referenceElement);

    createLitPortal({
      template: embedCardStyleMenu,
      container: this.embedCardToolbarElement,
      computePosition: {
        referenceElement,
        placement: 'top',
        middleware: [flip(), offset(8)],
        autoUpdate: true,
      },
      abortController: this._cardStyleMenuAbortController,
    });
  }

  private _toggleMoreMenu() {
    if (this._cardStyleMenuAbortController) {
      this._cardStyleMenuAbortController.abort();
      this._cardStyleMenuAbortController = null;
    }
    if (this._moreMenuAbortController) {
      this._moreMenuAbortController.abort();
      this._moreMenuAbortController = null;
      return;
    }
    this._moreMenuAbortController = new AbortController();
    const embedCardMoreMenu = new EmbedCardMoreMenu();
    embedCardMoreMenu.block = this.block;
    embedCardMoreMenu.abortController = this.abortController;

    createLitPortal({
      template: embedCardMoreMenu,
      container: this.embedCardToolbarElement,
      computePosition: {
        referenceElement: this.embedCardToolbarElement,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
      abortController: this._moreMenuAbortController,
    });
  }

  override render() {
    const model = this._model;
    this._embedOptions =
      'url' in model ? this._pageService.getEmbedBlockOptions(model.url) : null;

    return html`
      <div class="embed-card-toolbar">
        ${this._canShowUrlOptions && 'url' in model
          ? html`
              <div
                class="embed-card-toolbar-button url"
                @click=${() => this._copyUrl()}
              >
                <span>${model.url}</span>
              </div>

              <icon-button
                size="32px"
                class="embed-card-toolbar-button copy"
                ?disabled=${model.page.readonly}
                @click=${() => this._copyUrl()}
              >
                ${CopyIcon}
                <affine-tooltip .offset=${12}
                  >${'Click to copy link'}</affine-tooltip
                >
              </icon-button>

              <icon-button
                size="32px"
                class="embed-card-toolbar-button edit"
                ?disabled=${model.page.readonly}
                @click=${() =>
                  toggleEmbedCardEditModal(this._host as EditorHost, model)}
              >
                ${EditIcon}
                <affine-tooltip .offset=${12}>${'Edit'}</affine-tooltip>
              </icon-button>

              <div class="divider"></div>
            `
          : nothing}
        ${isEmbedLinkedDocBlock(model) || isEmbedSyncedDocBlock(model)
          ? html`
              <div
                class="embed-card-toolbar-button page-info"
                @click=${() => this.block.open()}
              >
                ${this._pageIcon}
                <span>${this._pageTitle}</span>
              </div>

              <icon-button
                size="32px"
                class="embed-card-toolbar-button open"
                @click=${() => this.block.open()}
              >
                ${OpenIcon}
                <affine-tooltip .offset=${12}>${'Open'}</affine-tooltip>
              </icon-button>

              <div class="divider"></div>
            `
          : nothing}

        <div class="embed-card-toolbar-button view-selector">
          <icon-button
            size="24px"
            class="embed-card-toolbar-button link"
            hover="false"
            ?disabled=${model.page.readonly}
            @click=${() => this._turnIntoInlineView()}
          >
            ${LinkIcon}
            <affine-tooltip .offset=${12}>${'Inline view'}</affine-tooltip>
          </icon-button>

          <icon-button
            size="24px"
            class=${classMap({
              'embed-card-toolbar-button': true,
              card: true,
              'current-view': this._isCardView,
            })}
            hover="false"
            ?disabled=${model.page.readonly}
            @click=${() => this._convertToCardView()}
          >
            ${BookmarkIcon}
            <affine-tooltip .offset=${12}>${'Card view'}</affine-tooltip>
          </icon-button>

          ${this._canConvertToEmbedView || this._isEmbedView
            ? html`
                <icon-button
                  size="24px"
                  class=${classMap({
                    'embed-card-toolbar-button': true,
                    embed: true,
                    'current-view': this._isEmbedView,
                  })}
                  hover="false"
                  ?disabled=${model.page.readonly}
                  @click=${() => this._convertToEmbedView()}
                >
                  ${EmbedWebIcon}
                  <affine-tooltip .offset=${12}>${'Embed view'}</affine-tooltip>
                </icon-button>
              `
            : nothing}
        </div>

        ${this._canShowCardStylePanel(model)
          ? html`
              <icon-button
                size="32px"
                class="embed-card-toolbar-button card-style"
                ?disabled=${model.page.readonly}
                @click=${() => this._toggleCardStyleMenu()}
              >
                ${PaletteIcon}
                <affine-tooltip .offset=${12}>${'Card style'}</affine-tooltip>
              </icon-button>
            `
          : nothing}

        <div class="divider"></div>

        <icon-button
          size="32px"
          class="embed-card-toolbar-button caption"
          ?disabled=${model.page.readonly}
          @click=${() => this._showCaption()}
        >
          ${CaptionIcon}
          <affine-tooltip .offset=${12}>${'Add Caption'}</affine-tooltip>
        </icon-button>

        <div class="divider"></div>

        <icon-button
          size="32px"
          class="embed-card-toolbar-button reload"
          ?disabled=${model.page.readonly}
          @click=${() => this._refreshData()}
        >
          ${RefreshIcon}
          <affine-tooltip .offset=${12}>${'Reload'}</affine-tooltip>
        </icon-button>

        <div class="divider"></div>

        <icon-button
          size="24px"
          class="embed-card-toolbar-button more-button"
          @click=${() => this._toggleMoreMenu()}
        >
          ${MoreVerticalIcon}
          <affine-tooltip .offset=${12}>More</affine-tooltip>
        </icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-toolbar': EmbedCardToolbar;
  }
}
