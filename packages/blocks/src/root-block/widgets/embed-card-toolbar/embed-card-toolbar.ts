import type { EditorHost } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, DocCollection } from '@blocksuite/store';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  type ReferenceElement,
} from '@floating-ui/dom';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { EmbedCardMoreMenu } from '../../../_common/components/embed-card/embed-card-more-menu-popper.js';
import { EmbedCardStyleMenu } from '../../../_common/components/embed-card/embed-card-style-popper.js';
import { toggleEmbedCardCaptionEditModal } from '../../../_common/components/embed-card/modal/embed-card-caption-edit-modal.js';
import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import {
  type EmbedToolbarBlockElement,
  type EmbedToolbarModel,
  isEmbedCardBlockElement,
} from '../../../_common/components/embed-card/type.js';
import { isPeekable, peek } from '../../../_common/components/index.js';
import { createLitPortal } from '../../../_common/components/portal.js';
import { toast } from '../../../_common/components/toast.js';
import {
  BookmarkIcon,
  MoreVerticalIcon,
} from '../../../_common/icons/edgeless.js';
import {
  CaptionIcon,
  CenterPeekIcon,
  CopyIcon,
  EditIcon,
  EmbedEdgelessIcon,
  EmbedPageIcon,
  EmbedWebIcon,
  LinkIcon,
  OpenIcon,
  PaletteIcon,
} from '../../../_common/icons/text.js';
import {
  getBlockComponentByPath,
  getModelByBlockComponent,
} from '../../../_common/utils/query.js';
import {
  type BookmarkBlockModel,
  BookmarkStyles,
} from '../../../bookmark-block/bookmark-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedLinkedDocBlockComponent } from '../../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedSyncedDocBlockComponent } from '../../../embed-synced-doc-block/embed-synced-doc-block.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../edgeless/utils/query.js';
import { RootBlockModel } from '../../root-model.js';
import type { EmbedOptions } from '../../root-service.js';
import { embedCardToolbarStyle } from './styles.js';

export const AFFINE_EMBED_CARD_TOOLBAR_WIDGET = 'affine-embed-card-toolbar';

@customElement(AFFINE_EMBED_CARD_TOOLBAR_WIDGET)
export class EmbedCardToolbar extends WidgetElement<
  EmbedToolbarModel,
  EmbedToolbarBlockElement
> {
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
    if (this.model.doc.readonly) {
      return true;
    }
    return (
      isEmbedLinkedDocBlock(this.model) &&
      (!!this.blockElement.closest('affine-embed-synced-doc-block') ||
        this.model.pageId === this.doc.id)
    );
  }

  get _openButtonDisabled() {
    return (
      isEmbedLinkedDocBlock(this.model) && this.model.pageId === this.doc.id
    );
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

  static override styles = embedCardToolbarStyle;

  private _abortController = new AbortController();

  private _cardStyleMenuAbortController: AbortController | null = null;

  private _moreMenuAbortController: AbortController | null = null;

  private _embedOptions: EmbedOptions | null = null;

  @query('.embed-card-toolbar')
  accessor embedCardToolbarElement!: HTMLElement;

  @query('.embed-card-toolbar-button.card-style')
  accessor cardStyleButton: HTMLElement | null = null;

  @query('.embed-card-toolbar-button.more-button')
  accessor moreButton: HTMLElement | null = null;

  @state()
  accessor hide: boolean = true;

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
          placement: 'top-start',
          middleware: [flip(), offset(8)],
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
    try {
      this.blockElement.captionEditor.show();
    } catch (_) {
      toggleEmbedCardCaptionEditModal(this.blockElement);
    }
    this._resetAbortController();
  }

  private _createMenu(
    referenceElement: ReferenceElement,
    menu: EmbedCardStyleMenu | EmbedCardMoreMenu,
    placement: Placement,
    offsetValue = 0
  ) {
    createLitPortal({
      template: menu,
      container: this.embedCardToolbarElement,
      computePosition: {
        referenceElement,
        placement,
        middleware: [flip(), offset(offsetValue)],
        autoUpdate: true,
      },
      abortController: menu.abortController,
      closeOnClickAway: true,
    });
  }

  private _toggleCardStyleMenu() {
    this._moreMenuAbortController?.abort();
    if (
      this._cardStyleMenuAbortController &&
      !this._cardStyleMenuAbortController.signal.aborted
    ) {
      this._cardStyleMenuAbortController.abort();
      return;
    }
    this._cardStyleMenuAbortController = new AbortController();

    if (!this._canShowCardStylePanel(this.model)) {
      return;
    }

    const embedCardStyleMenu = new EmbedCardStyleMenu();
    embedCardStyleMenu.model = this.model;
    embedCardStyleMenu.abortController = this._cardStyleMenuAbortController;

    assertExists(this.cardStyleButton);
    this._createMenu(this.cardStyleButton, embedCardStyleMenu, 'top', 4);
  }

  private _toggleMoreMenu() {
    this._cardStyleMenuAbortController?.abort();
    // Abort the previous menu if it's not aborted
    if (
      this._moreMenuAbortController &&
      !this._moreMenuAbortController.signal.aborted
    ) {
      this._moreMenuAbortController.abort();
      return;
    }
    this._moreMenuAbortController = new AbortController();

    const embedCardMoreMenu = new EmbedCardMoreMenu();
    embedCardMoreMenu.block = this.blockElement;
    embedCardMoreMenu.abortController = this._moreMenuAbortController;

    assertExists(this.moreButton);
    this._createMenu(
      this.embedCardToolbarElement,
      embedCardMoreMenu,
      'top-end'
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this._selection.slots.changed.on(() => {
        const hasTextSelection = this._selection.find('text');
        if (hasTextSelection) {
          this._hide();
          return;
        }

        const blockSelections = this._selection.filter('block');
        if (!blockSelections || blockSelections.length !== 1) {
          this._hide();
          return;
        }

        const block = getBlockComponentByPath(
          this.host,
          blockSelections[0].blockId
        );
        if (!block || !isEmbedCardBlockElement(block)) {
          this._hide();
          return;
        }

        this.blockElement = block;
        this.model = getModelByBlockComponent(block) as EmbedToolbarModel;

        this._show();
      })
    );
  }

  override willUpdate(changedProperties: PropertyValues<typeof this>) {
    // avoid no selection change on the first update so that `this.model` will be root block model
    if (!this.hasUpdated) return;

    // `this.model` is only controlled by selection changed event
    if (changedProperties.has('model')) {
      const previousModel = changedProperties.get('model');
      assertExists(previousModel);
      if (this.model instanceof RootBlockModel) {
        this.model = previousModel;
      }
    }
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
        @click=${(e: MouseEvent) => e.stopPropagation()}
        @dblclick=${(e: MouseEvent) => e.stopPropagation()}
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
                ?disabled=${this._openButtonDisabled}
              >
                ${isEmbedLinkedDocBlock(model)
                  ? nothing
                  : html`${this._pageIcon} <span>${this._docTitle}</span>`}
                ${OpenIcon}
                <affine-tooltip .offset=${12}
                  >${'Open this doc'}</affine-tooltip
                >
              </icon-button>

              <div class="divider"></div>
            `
          : nothing}
        ${isPeekable(this.blockElement)
          ? html`<icon-button
                size="24px"
                class="embed-card-toolbar-button peek"
                @click=${() => peek(this.blockElement)}
              >
                ${CenterPeekIcon}
                <affine-tooltip .offset=${12}
                  >${'Open in center peek'}</affine-tooltip
                >
              </icon-button>
              <div class="divider"></div>`
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
                  ?disabled=${this._embedViewButtonDisabled}
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
    [AFFINE_EMBED_CARD_TOOLBAR_WIDGET]: EmbedCardToolbar;
  }
}
