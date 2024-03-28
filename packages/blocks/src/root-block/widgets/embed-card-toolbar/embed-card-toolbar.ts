import type { EditorHost } from '@blocksuite/block-std';
import { PathFinder, WidgetElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, DocCollection } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { EmbedCardMoreMenu } from '../../../_common/components/embed-card/embed-card-more-menu-popper.js';
import { EmbedCardStyleMenu } from '../../../_common/components/embed-card/embed-card-style-popper.js';
import { toggleEmbedCardCaptionEditModal } from '../../../_common/components/embed-card/modal/embed-card-caption-edit-modal.js';
import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import type {
  EmbedToolbarBlockElement,
  EmbedToolbarModel,
} from '../../../_common/components/embed-card/type.js';
import { createLitPortal } from '../../../_common/components/portal.js';
import { toast } from '../../../_common/components/toast.js';
import {
  type BookmarkBlockModel,
  BookmarkIcon,
  BookmarkStyles,
  CaptionIcon,
  CopyIcon,
  EditIcon,
  EmbedEdgelessIcon,
  type EmbedGithubModel,
  type EmbedLinkedDocBlockComponent,
  type EmbedLinkedDocModel,
  EmbedPageIcon,
  type EmbedSyncedDocBlockComponent,
  EmbedWebIcon,
  LinkIcon,
  MoreVerticalIcon,
  OpenIcon,
  PaletteIcon,
} from '../../../index.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../edgeless/utils/query.js';
import type { EmbedOptions } from '../../root-service.js';

export const EMBED_CARD_TOOLBAR = 'embed-card-toolbar';

@customElement(EMBED_CARD_TOOLBAR)
export class EmbedCardToolbar extends WidgetElement<
  EmbedToolbarModel,
  EmbedToolbarBlockElement
> {
  static override styles = css`
    .embed-card-toolbar {
      position: absolute;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 8px;
      gap: 8px;
      height: 40px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      width: max-content;
      z-index: var(--affine-z-index-popover);
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

    .embed-card-toolbar-button.doc-info {
      display: flex;
      align-items: center;
      width: max-content;
      max-width: 180px;

      gap: 4px;
      opacity: var(--add, 1);
      user-select: none;
      cursor: pointer;
    }

    .embed-card-toolbar-button.doc-info > svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .embed-card-toolbar-button.doc-info > span {
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

  @query('.embed-card-toolbar')
  embedCardToolbarElement!: HTMLElement;

  @query('.embed-card-toolbar-button.card-style')
  cardStyleButton?: HTMLElement;

  @state()
  hide: boolean = true;

  private _abortController = new AbortController();
  private _resetAbortController = () => {
    this._abortController.abort();
    this._abortController = new AbortController();
  };

  private _show() {
    this.hide = false;
    this._abortController.signal.addEventListener(
      'abort',
      autoUpdate(this.blockElement, this, () => {
        computePosition(this.blockElement, this, {
          placement: 'top-end',
          middleware: [flip(), offset(4)],
        })
          .then(({ x, y }) => {
            this.style.left = `${x}px`;
            this.style.top = `${y}px`;
          })
          .catch(console.error);
      })
    );
  }

  private _hide() {
    this._resetAbortController();
    this.hide = true;
  }

  private _cardStyleMenuAbortController: AbortController | null = null;

  private _moreMenuAbortController: AbortController | null = null;

  private _embedOptions: EmbedOptions | null = null;

  private get _selection() {
    return this.host.selection;
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private get _canShowUrlOptions() {
    return 'url' in this.model && this._isCardView;
  }

  private get _isCardView() {
    return (
      isBookmarkBlock(this.model) ||
      isEmbedLinkedDocBlock(this.model) ||
      this._embedOptions?.viewType === 'card'
    );
  }

  private get _isEmbedView() {
    return (
      !isBookmarkBlock(this.model) &&
      (isEmbedSyncedDocBlock(this.model) ||
        this._embedOptions?.viewType === 'embed')
    );
  }

  private get _canConvertToEmbedView() {
    // synced doc entry controlled by awareness flag
    if (isEmbedLinkedDocBlock(this.model)) {
      const isSyncedDocEnabled = this.model.doc.awarenessStore.getFlag(
        'enable_synced_doc_block'
      );
      if (!isSyncedDocEnabled) {
        return false;
      }
    }

    return (
      'convertToEmbed' in this.blockElement ||
      this._embedOptions?.viewType === 'embed'
    );
  }

  private get _embedViewButtonDisabled() {
    return (
      isEmbedLinkedDocBlock(this.model) &&
      !!this.blockElement.closest('affine-embed-synced-doc-block')
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
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast(this.host as EditorHost, 'Copied link to clipboard');
  }

  private get _pageIcon() {
    if (
      !isEmbedLinkedDocBlock(this.model) &&
      !isEmbedSyncedDocBlock(this.model)
    ) {
      return nothing;
    }
    const block = this.blockElement as
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
    const block = this.blockElement as
      | EmbedLinkedDocBlockComponent
      | EmbedSyncedDocBlockComponent;
    return block.docTitle;
  }

  private _turnIntoInlineView() {
    if ('covertToInline' in this.blockElement) {
      this.blockElement.covertToInline();
      return;
    }

    if (!('url' in this.model)) {
      return;
    }

    const { doc } = this.model;
    const parent = doc.getParent(this.model);
    const index = parent?.children.indexOf(this.model);

    const yText = new DocCollection.Y.Text();
    const insert = this.model.title || this.model.caption || this.model.url;
    yText.insert(0, insert);
    yText.format(0, insert.length, { link: this.model.url });
    const text = new doc.Text(yText);
    doc.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    doc.deleteBlock(this.model);
  }

  private _convertToCardView() {
    if (this._isCardView) {
      return;
    }

    if ('convertToCard' in this.blockElement) {
      this.blockElement.convertToCard();
      return;
    }

    if (!('url' in this.model)) {
      return;
    }

    const { doc, url, style, caption } = this.model;

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

    const parent = doc.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    doc.addBlock(
      targetFlavour as never,
      { url, style: targetStyle, caption },
      parent,
      index
    );
    this.std.selection.setGroup('note', []);
    doc.deleteBlock(this.model);
  }

  private _convertToEmbedView() {
    if (this._isEmbedView) {
      return;
    }

    if ('convertToEmbed' in this.blockElement) {
      this.blockElement.convertToEmbed();
      return;
    }

    if (!('url' in this.model)) {
      return;
    }

    const { doc, url, style, caption } = this.model;

    if (!this._embedOptions || this._embedOptions.viewType !== 'embed') {
      return;
    }
    const { flavour, styles } = this._embedOptions;

    const targetStyle = styles.includes(style)
      ? style
      : styles.filter(style => style !== 'vertical' && style !== 'cube')[0];

    const parent = doc.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    doc.addBlock(
      flavour as never,
      { url, style: targetStyle, caption },
      parent,
      index
    );

    this.std.selection.setGroup('note', []);
    doc.deleteBlock(this.model);
  }

  private _showCaption() {
    const captionElement = this.blockElement.captionElement;
    if (captionElement) {
      captionElement.show();
    } else {
      toggleEmbedCardCaptionEditModal(this.blockElement);
    }
    this._resetAbortController();
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
    if (!this._canShowCardStylePanel(this.model)) {
      return;
    }
    this._cardStyleMenuAbortController = new AbortController();
    const embedCardStyleMenu = new EmbedCardStyleMenu();
    embedCardStyleMenu.model = this.model;
    embedCardStyleMenu.abortController = this._abortController;

    const referenceElement = this.cardStyleButton;
    assertExists(referenceElement);

    createLitPortal({
      template: embedCardStyleMenu,
      container: this.embedCardToolbarElement,
      computePosition: {
        referenceElement,
        placement: 'top',
        middleware: [flip()],
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
    embedCardMoreMenu.block = this.blockElement;
    embedCardMoreMenu.abortController = this._abortController;

    createLitPortal({
      template: embedCardMoreMenu,
      container: this.embedCardToolbarElement,
      computePosition: {
        referenceElement: this.embedCardToolbarElement,
        placement: 'top-end',
        middleware: [flip()],
        autoUpdate: true,
      },
      abortController: this._moreMenuAbortController,
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this._selection.slots.changed.on(() => {
        console.log('selection changed');
        const hasTextSelection = this._selection.find('text');
        if (hasTextSelection) {
          this._hide();
          return;
        }

        const blockSelections = this._selection.filter('block');
        if (
          !blockSelections ||
          blockSelections.length !== 1 ||
          !PathFinder.equals(blockSelections[0].path, this.blockElement.path)
        ) {
          this._hide();
          return;
        }

        this._show();
      })
    );
  }

  override render() {
    if (this.hide) return nothing;

    const model = this.model;
    this._embedOptions =
      'url' in model ? this._rootService.getEmbedBlockOptions(model.url) : null;

    return html`
      <div
        class="embed-card-toolbar"
        @pointerdown=${(e: MouseEvent) => e.stopPropagation()}
      >
        ${this._canShowUrlOptions && 'url' in model
          ? html`
              <div
                class="embed-card-toolbar-button url"
                @click=${() => this._copyUrl()}
              >
                <span>${model.url}</span>
              </div>

              <icon-button
                size="24px"
                class="embed-card-toolbar-button copy"
                ?disabled=${model.doc.readonly}
                @click=${() => this._copyUrl()}
              >
                ${CopyIcon}
                <affine-tooltip .offset=${12}
                  >${'Click to copy link'}</affine-tooltip
                >
              </icon-button>

              <icon-button
                size="24px"
                class="embed-card-toolbar-button edit"
                ?disabled=${model.doc.readonly}
                @click=${() => toggleEmbedCardEditModal(this.host, model)}
              >
                ${EditIcon}
                <affine-tooltip .offset=${12}>${'Edit'}</affine-tooltip>
              </icon-button>

              <div class="divider"></div>
            `
          : nothing}
        ${isEmbedLinkedDocBlock(model) || isEmbedSyncedDocBlock(model)
          ? html`
              <icon-button
                size="24px"
                class="embed-card-toolbar-button doc-info"
                @click=${() => this.blockElement.open()}
              >
                ${isEmbedLinkedDocBlock(model)
                  ? nothing
                  : html`${this._pageIcon} <span>${this._docTitle}</span>`}
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
            .hover=${false}
            ?disabled=${model.doc.readonly}
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
            .hover=${false}
            ?disabled=${model.doc.readonly}
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
                  .hover=${false}
                  ?disabled=${model.doc.readonly ||
                  this._embedViewButtonDisabled}
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
                size="24px"
                class="embed-card-toolbar-button card-style"
                ?disabled=${model.doc.readonly}
                @click=${() => this._toggleCardStyleMenu()}
              >
                ${PaletteIcon}
                <affine-tooltip .offset=${12}>${'Card style'}</affine-tooltip>
              </icon-button>
            `
          : nothing}

        <div class="divider"></div>

        <icon-button
          size="24px"
          class="embed-card-toolbar-button caption"
          ?disabled=${model.doc.readonly}
          @click=${() => this._showCaption()}
        >
          ${CaptionIcon}
          <affine-tooltip .offset=${12}>${'Add Caption'}</affine-tooltip>
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
    [EMBED_CARD_TOOLBAR]: EmbedCardToolbar;
  }
}
