import type { RootBlockModel } from '@blocksuite/affine-model';

import {
  CaptionIcon,
  CenterPeekIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  ExpandFullSmallIcon,
  MoreVerticalIcon,
  OpenIcon,
  PaletteIcon,
  RefreshIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import {
  type Action,
  renderActions,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import {
  type BookmarkBlockModel,
  BookmarkStyles,
  type EmbedGithubModel,
  type EmbedLinkedDocModel,
} from '@blocksuite/affine-model';
import { getBlockProps, getHostName } from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, DocCollection, Slice } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { type TemplateResult, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EmbedCardStyle } from '../../../_common/types.js';
import type { EmbedOptions } from '../../root-service.js';
import type { RootBlockComponent } from '../../types.js';

import '../../../_common/components/button.js';
import { toggleEmbedCardCaptionEditModal } from '../../../_common/components/embed-card/modal/embed-card-caption-edit-modal.js';
import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import {
  type EmbedToolbarBlockComponent,
  type EmbedToolbarModel,
  isEmbedCardBlockComponent,
} from '../../../_common/components/embed-card/type.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
  isEmbeddedLinkBlock,
  isImageBlock,
} from '../../edgeless/utils/query.js';
import { embedCardToolbarStyle } from './styles.js';

export const AFFINE_EMBED_CARD_TOOLBAR_WIDGET = 'affine-embed-card-toolbar';

@customElement(AFFINE_EMBED_CARD_TOOLBAR_WIDGET)
export class EmbedCardToolbar extends WidgetComponent<
  RootBlockModel,
  RootBlockComponent
> {
  private _abortController = new AbortController();

  private _embedOptions: EmbedOptions | null = null;

  private _focusBlock: EmbedToolbarBlockComponent | null = null;

  private _resetAbortController = () => {
    this._abortController.abort();
    this._abortController = new AbortController();
  };

  static override styles = embedCardToolbarStyle;

  private get _canConvertToEmbedView() {
    // synced doc entry controlled by awareness flag
    if (this._focusModel && isEmbedLinkedDocBlock(this._focusModel)) {
      const isSyncedDocEnabled = this.doc.awarenessStore.getFlag(
        'enable_synced_doc_block'
      );
      if (!isSyncedDocEnabled) {
        return false;
      }
    }

    if (!this._focusBlock) return false;

    return (
      'convertToEmbed' in this._focusBlock ||
      this._embedOptions?.viewType === 'embed'
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

  private get _canShowUrlOptions() {
    return this._focusModel && 'url' in this._focusModel && this._isCardView;
  }

  private _cardStyleMenuButton() {
    if (this._focusModel && this._canShowCardStylePanel(this._focusModel)) {
      const { EmbedCardHorizontalIcon, EmbedCardListIcon } =
        getEmbedCardIcons();

      const buttons = [
        {
          type: 'horizontal',
          name: 'Large horizontal style',
          icon: EmbedCardHorizontalIcon,
        },
        {
          type: 'list',
          name: 'Small horizontal style',
          icon: EmbedCardListIcon,
        },
      ] as {
        type: EmbedCardStyle;
        name: string;
        icon: TemplateResult<1>;
      }[];

      return html`
        <editor-menu-button
          class="card-style-select"
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
          <div>
            ${repeat(
              buttons,
              button => button.type,
              ({ type, name, icon }) => html`
                <icon-button
                  width="76px"
                  height="76px"
                  aria-label=${name}
                  class=${classMap({
                    selected: this._focusModel?.style === type,
                  })}
                  @click=${() => this._setEmbedCardStyle(type)}
                >
                  ${icon}
                  <affine-tooltip .offset=${4}>${name}</affine-tooltip>
                </icon-button>
              `
            )}
          </div>
        </editor-menu-button>
      `;
    }

    return nothing;
  }

  private _convertToCardView() {
    if (this._isCardView) {
      return;
    }
    if (!this._focusBlock) {
      return;
    }

    if ('convertToCard' in this._focusBlock) {
      this._focusBlock.convertToCard();
      return;
    }

    if (!this._focusModel || !('url' in this._focusModel)) {
      return;
    }

    const { doc, url, style, caption } = this._focusModel;

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

    const parent = doc.getParent(this._focusModel);
    assertExists(parent);
    const index = parent.children.indexOf(this._focusModel);

    doc.addBlock(
      targetFlavour as never,
      { url, style: targetStyle, caption },
      parent,
      index
    );
    this.std.selection.setGroup('note', []);
    doc.deleteBlock(this._focusModel);
  }

  private _convertToEmbedView() {
    if (this._isEmbedView) {
      return;
    }

    if (!this._focusBlock) {
      return;
    }

    if ('convertToEmbed' in this._focusBlock) {
      this._focusBlock.convertToEmbed();
      return;
    }

    if (!this._focusModel || !('url' in this._focusModel)) {
      return;
    }

    const { doc, url, style, caption } = this._focusModel;

    if (!this._embedOptions || this._embedOptions.viewType !== 'embed') {
      return;
    }
    const { flavour, styles } = this._embedOptions;

    const targetStyle = styles.includes(style)
      ? style
      : styles.filter(style => style !== 'vertical' && style !== 'cube')[0];

    const parent = doc.getParent(this._focusModel);
    assertExists(parent);
    const index = parent.children.indexOf(this._focusModel);

    doc.addBlock(
      flavour as never,
      { url, style: targetStyle, caption },
      parent,
      index
    );

    this.std.selection.setGroup('note', []);
    doc.deleteBlock(this._focusModel);
  }

  private async _copyBlock() {
    if (!this._focusModel) {
      return;
    }
    const slice = Slice.fromModels(this.doc, [this._focusModel]);
    await this.std.clipboard.copySlice(slice);
    toast(this.host, 'Copied link to clipboard');
    this._abortController.abort();
  }

  private _copyUrl() {
    if (!this._focusModel || !('url' in this._focusModel)) {
      return;
    }

    navigator.clipboard.writeText(this._focusModel.url).catch(console.error);
    toast(this.host, 'Copied link to clipboard');
  }

  private _duplicateBlock() {
    if (!this._focusBlock || !this._focusModel) {
      return;
    }
    const model = this._focusModel;
    const blockProps = getBlockProps(model);
    const { width, height, xywh, rotate, zIndex, ...duplicateProps } =
      blockProps;

    const { doc } = model;
    const parent = doc.getParent(model);
    const index = parent?.children.indexOf(model);
    doc.addBlock(
      model.flavour as BlockSuite.Flavour,
      duplicateProps,
      parent,
      index
    );
    this._abortController.abort();
  }

  private get _embedViewButtonDisabled() {
    if (this.doc.readonly) {
      return true;
    }
    return (
      this._focusModel &&
      this._focusBlock &&
      isEmbedLinkedDocBlock(this._focusModel) &&
      (!!this._focusBlock.closest('affine-embed-synced-doc-block') ||
        this._focusModel.pageId === this.doc.id)
    );
  }

  private get _focusModel(): EmbedToolbarModel | undefined {
    return this._focusBlock?.model;
  }

  private _hide() {
    this._resetAbortController();
    this._focusBlock = null;
    this.hide = true;
  }

  private get _isCardView() {
    return (
      this._focusModel &&
      (isBookmarkBlock(this._focusModel) ||
        isEmbedLinkedDocBlock(this._focusModel) ||
        this._embedOptions?.viewType === 'card')
    );
  }

  private get _isEmbedView() {
    return (
      this._focusModel &&
      !isBookmarkBlock(this._focusModel) &&
      (isEmbedSyncedDocBlock(this._focusModel) ||
        this._embedOptions?.viewType === 'embed')
    );
  }

  private _moreActions() {
    return renderActions([
      [
        {
          type: 'copy',
          name: 'Copy',
          icon: CopyIcon,
          disabled: this.doc.readonly,
          handler: () => {
            this._copyBlock().catch(console.error);
          },
        },
        {
          type: 'duplicate',
          name: 'Duplicate',
          icon: DuplicateIcon,
          disabled: this.doc.readonly,
          handler: () => this._duplicateBlock(),
        },

        this._focusModel && this._refreshable(this._focusModel)
          ? {
              type: 'reload',
              name: 'Reload',
              icon: RefreshIcon,
              disabled: this.doc.readonly,
              handler: () => this._refreshData(),
            }
          : nothing,
      ],
      [
        {
          type: 'delete',
          name: 'Delete',
          icon: DeleteIcon,
          disabled: this.doc.readonly,
          handler: () =>
            this._focusModel && this.doc.deleteBlock(this._focusModel),
        },
      ],
    ]);
  }

  get _openButtonDisabled() {
    return (
      this._focusModel &&
      isEmbedLinkedDocBlock(this._focusModel) &&
      this._focusModel.pageId === this.doc.id
    );
  }

  private _openMenuButton() {
    const buttons: Action[] = [];

    if (
      this._focusModel &&
      (isEmbedLinkedDocBlock(this._focusModel) ||
        isEmbedSyncedDocBlock(this._focusModel))
    ) {
      buttons.push({
        name: 'Open this doc',
        icon: ExpandFullSmallIcon,
        handler: () => this._focusBlock?.open(),
      });
    }

    // open in new tab

    const element = this._focusBlock;
    if (element && isPeekable(element)) {
      buttons.push({
        name: 'Open in center peek',
        icon: CenterPeekIcon,
        handler: () => peek(element),
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

  private _refreshData() {
    this._focusBlock?.refreshData();
    this._abortController.abort();
  }

  private _refreshable(ele: BlockModel) {
    return (
      isImageBlock(ele) ||
      isBookmarkBlock(ele) ||
      isAttachmentBlock(ele) ||
      isEmbeddedLinkBlock(ele)
    );
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private get _selection() {
    return this.host.selection;
  }

  private _setEmbedCardStyle(style: EmbedCardStyle) {
    this._focusModel?.doc.updateBlock(this._focusModel, { style });
    this.requestUpdate();
    this._abortController.abort();
  }

  private _show() {
    if (!this._focusBlock) {
      return;
    }
    this.hide = false;
    this._abortController.signal.addEventListener(
      'abort',
      autoUpdate(this._focusBlock, this, () => {
        if (!this._focusBlock) {
          return;
        }
        computePosition(this._focusBlock, this, {
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

  private _showCaption() {
    const focusBlock = this._focusBlock;
    if (!focusBlock) {
      return;
    }
    try {
      focusBlock.captionEditor?.show();
    } catch (_) {
      toggleEmbedCardCaptionEditModal(focusBlock);
    }
    this._resetAbortController();
  }

  private _turnIntoInlineView() {
    if (this._focusBlock && 'covertToInline' in this._focusBlock) {
      this._focusBlock.covertToInline();
      return;
    }

    if (!this._focusModel || !('url' in this._focusModel)) {
      return;
    }

    const { doc } = this._focusModel;
    const parent = doc.getParent(this._focusModel);
    const index = parent?.children.indexOf(this._focusModel);

    const yText = new DocCollection.Y.Text();
    const insert =
      this._focusModel.title ||
      this._focusModel.caption ||
      this._focusModel.url;
    yText.insert(0, insert);
    yText.format(0, insert.length, { link: this._focusModel.url });
    const text = new doc.Text(yText);
    doc.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    doc.deleteBlock(this._focusModel);
  }

  private _viewMenuButton() {
    const buttons = [];

    buttons.push({
      type: 'inline',
      name: 'Inline view',
      handler: () => this._turnIntoInlineView(),
      disabled: this.doc.readonly,
    });

    buttons.push({
      type: 'card',
      name: 'Card view',
      handler: () => this._convertToCardView(),
      disabled: this.doc.readonly,
    });

    if (this._canConvertToEmbedView || this._isEmbedView) {
      buttons.push({
        type: 'embed',
        name: 'Embed view',
        handler: () => this._convertToEmbedView(),
        disabled: this.doc.readonly && this._embedViewButtonDisabled,
      });
    }

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
              <span style="text-transform: capitalize">${this._viewType}</span>
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

  private get _viewType(): 'inline' | 'embed' | 'card' {
    if (this._isCardView) {
      return 'card';
    }

    if (this._isEmbedView) {
      return 'embed';
    }

    return 'inline';
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

        const block = this.std.view.getBlock(blockSelections[0].blockId);
        if (!block || !isEmbedCardBlockComponent(block)) {
          this._hide();
          return;
        }

        this._focusBlock = block as EmbedToolbarBlockComponent;
        this._show();
      })
    );
  }

  override render() {
    if (this.hide) return nothing;

    const model = this._focusModel;
    this._embedOptions =
      model && 'url' in model
        ? this._rootService.getEmbedBlockOptions(model.url)
        : null;

    const buttons = [
      this._canShowUrlOptions && model && 'url' in model
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
              aria-label="Copy"
              data-testid="copy-link"
              .tooltip=${'Click to copy link'}
              ?disabled=${model.doc.readonly}
              @click=${() => this._copyUrl()}
            >
              ${CopyIcon}
            </editor-icon-button>

            <editor-icon-button
              aria-label="Edit"
              data-testid="edit"
              .tooltip=${'Edit'}
              ?disabled=${this.doc.readonly}
              @click=${() => toggleEmbedCardEditModal(this.host, model)}
            >
              ${EditIcon}
            </editor-icon-button>
          `
        : nothing,

      this._openMenuButton(),

      this._viewMenuButton(),

      this._cardStyleMenuButton(),

      html`
        <editor-icon-button
          aria-label="Caption"
          .tooltip=${'Add Caption'}
          ?disabled=${this.doc.readonly}
          @click=${() => this._showCaption()}
        >
          ${CaptionIcon}
        </editor-icon-button>
      `,

      html`
        <editor-menu-button
          .contentPadding=${'8px'}
          .button=${html`
            <editor-icon-button aria-label="More" .tooltip=${'More'}>
              ${MoreVerticalIcon}
            </editor-icon-button>
          `}
        >
          <div data-size="large" data-orientation="vertical">
            ${this._moreActions()}
          </div>
        </editor-menu-button>
      `,
    ];

    return html`
      <editor-toolbar class="embed-card-toolbar">
        ${join(
          buttons.filter(button => button !== nothing),
          renderToolbarSeparator
        )}
      </editor-toolbar>
    `;
  }

  @query('.embed-card-toolbar-button.card-style')
  accessor cardStyleButton: HTMLElement | null = null;

  @query('.embed-card-toolbar')
  accessor embedCardToolbarElement!: HTMLElement;

  @state()
  accessor hide: boolean = true;

  @query('.embed-card-toolbar-button.more-button')
  accessor moreButton: HTMLElement | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EMBED_CARD_TOOLBAR_WIDGET]: EmbedCardToolbar;
  }
}
