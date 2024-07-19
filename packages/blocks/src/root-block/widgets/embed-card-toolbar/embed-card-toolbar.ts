import type { EditorHost } from '@blocksuite/block-std';

import { WidgetElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, DocCollection, Slice } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { type PropertyValues, type TemplateResult, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EmbedCardStyle } from '../../../_common/types.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedOptions } from '../../root-service.js';

import '../../../_common/components/button.js';
import { toggleEmbedCardCaptionEditModal } from '../../../_common/components/embed-card/modal/embed-card-caption-edit-modal.js';
import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import {
  type EmbedToolbarBlockElement,
  type EmbedToolbarModel,
  isEmbedCardBlockElement,
} from '../../../_common/components/embed-card/type.js';
import { isPeekable, peek } from '../../../_common/components/index.js';
import { toast } from '../../../_common/components/toast.js';
import '../../../_common/components/toolbar/icon-button.js';
import '../../../_common/components/toolbar/menu-button.js';
import '../../../_common/components/toolbar/separator.js';
import { renderToolbarSeparator } from '../../../_common/components/toolbar/separator.js';
import '../../../_common/components/toolbar/toolbar.js';
import {
  type Action,
  renderActions,
} from '../../../_common/components/toolbar/utils.js';
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
} from '../../../_common/icons/index.js';
import { getBlockProps } from '../../../_common/utils/block-props.js';
import {
  getBlockComponentByPath,
  getModelByBlockComponent,
} from '../../../_common/utils/query.js';
import { getEmbedCardIcons, getHostName } from '../../../_common/utils/url.js';
import {
  type BookmarkBlockModel,
  BookmarkStyles,
} from '../../../bookmark-block/bookmark-model.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
  isEmbeddedLinkBlock,
  isImageBlock,
} from '../../edgeless/utils/query.js';
import { RootBlockModel } from '../../root-model.js';
import { embedCardToolbarStyle } from './styles.js';

export const AFFINE_EMBED_CARD_TOOLBAR_WIDGET = 'affine-embed-card-toolbar';

@customElement(AFFINE_EMBED_CARD_TOOLBAR_WIDGET)
export class EmbedCardToolbar extends WidgetElement<
  EmbedToolbarModel,
  EmbedToolbarBlockElement
> {
  private _abortController = new AbortController();

  private _embedOptions: EmbedOptions | null = null;

  private _resetAbortController = () => {
    this._abortController.abort();
    this._abortController = new AbortController();
  };

  static override styles = embedCardToolbarStyle;

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
    return 'url' in this.model && this._isCardView;
  }

  private _cardStyleMenuButton() {
    if (this._canShowCardStylePanel(this.blockElement.model)) {
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
          <div slot>
            ${repeat(
              buttons,
              button => button.type,
              ({ type, name, icon }) => html`
                <icon-button
                  width="76px"
                  height="76px"
                  aria-label=${name}
                  class=${classMap({ selected: this.model.style === type })}
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

  private async _copyBlock() {
    const slice = Slice.fromModels(this.doc, [this.blockElement.model]);
    await this.std.clipboard.copySlice(slice);
    toast(this.blockElement.host, 'Copied link to clipboard');
    this._abortController.abort();
  }

  private _copyUrl() {
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast(this.host as EditorHost, 'Copied link to clipboard');
  }

  private _duplicateBlock() {
    const model = this.blockElement.model;
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
    if (this.model.doc.readonly) {
      return true;
    }
    return (
      isEmbedLinkedDocBlock(this.model) &&
      (!!this.blockElement.closest('affine-embed-synced-doc-block') ||
        this.model.pageId === this.doc.id)
    );
  }

  private _hide() {
    this._resetAbortController();
    this.hide = true;
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

        this._refreshable(this.model)
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
          handler: () => this.doc.deleteBlock(this.model),
        },
      ],
    ]);
  }

  get _openButtonDisabled() {
    return (
      isEmbedLinkedDocBlock(this.model) && this.model.pageId === this.doc.id
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
        handler: () => this.blockElement.open(),
      });
    }

    // open in new tab

    if (isPeekable(this.blockElement)) {
      buttons.push({
        name: 'Open in center peek',
        icon: CenterPeekIcon,
        handler: () => peek(this.blockElement),
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
        <div slot data-size="small" data-orientation="vertical">
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
    this.blockElement.refreshData();
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
    this.model.doc.updateBlock(this.model, { style });
    this.requestUpdate();
    this._abortController.abort();
  }

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

  private _showCaption() {
    try {
      this.blockElement.captionEditor.show();
    } catch (_) {
      toggleEmbedCardCaptionEditModal(this.blockElement);
    }
    this._resetAbortController();
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

  private _viewMenuButton() {
    const buttons = [];

    buttons.push({
      type: 'inline',
      name: 'Inline view',
      handler: () => this._turnIntoInlineView(),
      disabled: this.model.doc.readonly,
    });

    buttons.push({
      type: 'card',
      name: 'Card view',
      handler: () => this._convertToCardView(),
      disabled: this.model.doc.readonly,
    });

    if (this._canConvertToEmbedView || this._isEmbedView) {
      buttons.push({
        type: 'embed',
        name: 'Embed view',
        handler: () => this._convertToEmbedView(),
        disabled: this.model.doc.readonly && this._embedViewButtonDisabled,
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
        <div slot data-size="small" data-orientation="vertical">
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

  override render() {
    if (this.hide) return nothing;

    const model = this.model;
    this._embedOptions =
      'url' in model ? this._rootService.getEmbedBlockOptions(model.url) : null;

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
              ?disabled=${model.doc.readonly}
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
          ?disabled=${model.doc.readonly}
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
          <div slot data-size="large" data-orientation="vertical">
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
