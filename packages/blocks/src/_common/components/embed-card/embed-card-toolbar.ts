import type { BlockStdScope } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockComponent } from '../../../bookmark-block/bookmark-block.js';
import {
  type BookmarkBlockModel,
  BookmarkStyles,
} from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaBlockComponent } from '../../../embed-figma-block/embed-figma-block.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubBlockComponent } from '../../../embed-github-block/embed-github-block.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedYoutubeBlockComponent } from '../../../embed-youtube-block/embed-youtube-block.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
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
import { toggleEmbedCardEditModal } from './modal/embed-card-edit-modal.js';

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
  model!:
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedFigmaModel
    | EmbedLinkedDocModel;

  @property({ attribute: false })
  block!:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent
    | EmbedFigmaBlockComponent
    | EmbedLinkedDocBlockComponent;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  abortController!: AbortController;

  @property({ attribute: false })
  std!: BlockStdScope;

  @query('.embed-card-toolbar')
  embedCardToolbarElement!: HTMLElement;

  @query('.embed-card-toolbar-button.card-style')
  cardStyleButton!: HTMLElement;

  private _cardStyleMenuAbortController: AbortController | null = null;

  private _moreMenuAbortController: AbortController | null = null;

  private _embedOptions: EmbedOptions | null = null;

  private get _pageService() {
    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    return pageService;
  }

  private get _canShowUrlOptions() {
    return (
      'url' in this.model &&
      (isBookmarkBlock(this.model) ||
        isEmbedGithubBlock(this.model) ||
        isEmbedLinkedDocBlock(this.model))
    );
  }

  private get _isCardView() {
    if (isBookmarkBlock(this.model) || isEmbedLinkedDocBlock(this.model)) {
      return true;
    }
    return this._embedOptions?.viewType === 'card';
  }

  private get _isEmbedView() {
    if (isBookmarkBlock(this.model) || isEmbedLinkedDocBlock(this.model)) {
      return false;
    }
    return this._embedOptions?.viewType === 'embed';
  }

  private get _canConvertToEmbedView() {
    return this._embedOptions?.viewType === 'embed';
  }

  private get _canShowCardStylePanel() {
    return (
      isBookmarkBlock(this.model) ||
      isEmbedGithubBlock(this.model) ||
      isEmbedLinkedDocBlock(this.model)
    );
  }

  private _copyUrl() {
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast(this.host as EditorHost, 'Copied link to clipboard');
    this.remove();
  }

  private _turnIntoInlineView() {
    if (isEmbedLinkedDocBlock(this.model)) {
      const block = this.block as EmbedLinkedDocBlockComponent;
      block.covertToInline();
      return;
    }

    const { page } = this.model;
    const parent = page.getParent(this.model);
    const index = parent?.children.indexOf(this.model);

    const yText = new Workspace.Y.Text();
    const insert = this.model.title || this.model.caption || this.model.url;
    yText.insert(0, insert);
    yText.format(0, insert.length, { link: this.model.url });
    const text = new page.Text(yText);
    page.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    page.deleteBlock(this.model);
  }

  private _convertToCardView() {
    if (this._isCardView || !('url' in this.model)) {
      return;
    }

    const { page, url, style } = this.model;

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

    const parent = page.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    page.addBlock(targetFlavour, { url, style: targetStyle }, parent, index);
    this.std.selection.setGroup('note', []);
    page.deleteBlock(this.model);
  }

  private _convertToEmbedView() {
    if (this._isEmbedView || !('url' in this.model)) {
      return;
    }

    const { page, url, style } = this.model;
    if (!this._embedOptions || this._embedOptions.viewType !== 'embed') {
      return;
    }

    const { flavour, styles } = this._embedOptions;

    const targetStyle = styles.includes(style)
      ? style
      : styles.filter(style => style !== 'vertical' && style !== 'cube')[0];

    const parent = page.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    page.addBlock(flavour, { url, style: targetStyle }, parent, index);

    this.std.selection.setGroup('note', []);
    page.deleteBlock(this.model);
  }

  private _showCaption() {
    this.block.showCaption = true;
    this.block.updateComplete
      .then(() => this.block.captionElement.input.focus())
      .catch(console.error);
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
    this._cardStyleMenuAbortController = new AbortController();
    const embedCardStyleMenu = new EmbedCardStyleMenu();
    embedCardStyleMenu.model = this.model;
    embedCardStyleMenu.std = this.std;
    embedCardStyleMenu.abortController = this.abortController;

    createLitPortal({
      template: embedCardStyleMenu,
      container: this.embedCardToolbarElement,
      computePosition: {
        referenceElement: this.cardStyleButton,
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
    embedCardMoreMenu.model = this.model;
    embedCardMoreMenu.block = this.block;
    embedCardMoreMenu.std = this.std;
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
    const model = this.model;
    if ('url' in this.model) {
      this._embedOptions = this._pageService.getEmbedBlockOptions(
        this.model.url
      );
    }
    return html`
      <div class="embed-card-toolbar">
        ${this._canShowUrlOptions && 'url' in model
          ? html`<div
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
                  toggleEmbedCardEditModal(this.host as EditorHost, model)}
              >
                ${EditIcon}
                <affine-tooltip .offset=${12}>${'Edit'}</affine-tooltip>
              </icon-button>

              <div class="divider"></div>`
          : nothing}
        ${isEmbedLinkedDocBlock(model)
          ? html`<icon-button
                size="32px"
                class="embed-card-toolbar-button open"
                @click=${() =>
                  (this.block as EmbedLinkedDocBlockComponent).open()}
              >
                ${OpenIcon}
                <affine-tooltip .offset=${12}>${'Open'}</affine-tooltip>
              </icon-button>

              <div class="divider"></div>`
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
          ${this._canConvertToEmbedView
            ? html`<icon-button
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
              </icon-button>`
            : nothing}
        </div>

        ${this._canShowCardStylePanel
          ? html` <icon-button
              size="32px"
              class="embed-card-toolbar-button card-style"
              ?disabled=${model.page.readonly}
              @click=${() => this._toggleCardStyleMenu()}
            >
              ${PaletteIcon}
              <affine-tooltip .offset=${12}>${'Card style'}</affine-tooltip>
            </icon-button>`
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
