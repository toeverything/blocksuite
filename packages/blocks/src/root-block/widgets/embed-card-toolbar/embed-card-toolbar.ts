import { getDocContentWithMaxLength } from '@blocksuite/affine-block-embed';
import {
  CaptionIcon,
  CenterPeekIcon,
  CopyIcon,
  EditIcon,
  ExpandFullSmallIcon,
  MoreVerticalIcon,
  OpenIcon,
  PaletteIcon,
  SmallArrowDownIcon,
} from '@blocksuite/affine-components/icons';
import { notifyLinkedDocSwitchedToEmbed } from '@blocksuite/affine-components/notification';
import { isPeekable, peek } from '@blocksuite/affine-components/peek';
import { toast } from '@blocksuite/affine-components/toast';
import {
  cloneGroups,
  type MenuItem,
  type MenuItemGroup,
  renderGroups,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import {
  type AliasInfo,
  type BookmarkBlockModel,
  BookmarkStyles,
  type EmbedGithubModel,
  type EmbedLinkedDocModel,
  type RootBlockModel,
} from '@blocksuite/affine-model';
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
import { type BlockStdScope, WidgetComponent } from '@blocksuite/block-std';
import { type BlockModel, DocCollection } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { html, nothing, type TemplateResult } from 'lit';
import { query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EmbedCardStyle } from '../../../_common/types.js';
import type { RootBlockComponent } from '../../types.js';

import { toggleEmbedCardCaptionEditModal } from '../../../_common/components/embed-card/modal/embed-card-caption-edit-modal.js';
import { toggleEmbedCardEditModal } from '../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import {
  type EmbedBlockComponent,
  type EmbedModel,
  isEmbedCardBlockComponent,
  isInternalEmbedModel,
} from '../../../_common/components/embed-card/type.js';
import { getEmbedCardIcons } from '../../../_common/utils/url.js';
import { getMoreMenuConfig } from '../../configs/toolbar.js';
import {
  isBookmarkBlock,
  isEmbedGithubBlock,
  isEmbedHtmlBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
} from '../../edgeless/utils/query.js';
import { BUILT_IN_GROUPS } from './config.js';
import { EmbedCardToolbarContext } from './context.js';
import { embedCardToolbarStyle } from './styles.js';

export const AFFINE_EMBED_CARD_TOOLBAR_WIDGET = 'affine-embed-card-toolbar';

export class EmbedCardToolbar extends WidgetComponent<
  RootBlockModel,
  RootBlockComponent
> {
  static override styles = embedCardToolbarStyle;

  private _abortController = new AbortController();

  private _copyUrl = () => {
    const model = this.focusModel;
    if (!model) return;

    let url!: ReturnType<GenerateDocUrlService['generateDocUrl']>;
    const isInternal = isInternalEmbedModel(model);

    if ('url' in model) {
      url = model.url;
    } else if (isInternal) {
      url = this.std
        .getOptional(GenerateDocUrlProvider)
        ?.generateDocUrl(model.pageId, model.params);
    }

    if (!url) return;

    navigator.clipboard.writeText(url).catch(console.error);
    toast(this.std.host, 'Copied link to clipboard');

    track(this.std, model, this._viewType, 'CopiedLink', {
      control: 'copy link',
    });
  };

  private _embedOptions: EmbedOptions | null = null;

  private _openEditPopup = (e: MouseEvent) => {
    e.stopPropagation();

    const model = this.focusModel;
    if (!model || isEmbedHtmlBlock(model)) return;

    const originalDocInfo = this._originalDocInfo;

    this._hide();

    toggleEmbedCardEditModal(this.host, model, this._viewType, originalDocInfo);

    track(this.std, model, this._viewType, 'OpenedAliasPopup', {
      control: 'edit',
    });
  };

  private _resetAbortController = () => {
    this._abortController.abort();
    this._abortController = new AbortController();
  };

  private _showCaption = () => {
    const focusBlock = this.focusBlock;
    if (!focusBlock) {
      return;
    }
    try {
      focusBlock.captionEditor?.show();
    } catch (_) {
      toggleEmbedCardCaptionEditModal(focusBlock);
    }
    this._resetAbortController();

    const model = this.focusModel;
    if (!model) return;

    track(this.std, model, this._viewType, 'OpenedCaptionEditor', {
      control: 'add caption',
    });
  };

  private _toggleCardStyleSelector = (e: Event) => {
    const opened = (e as CustomEvent<boolean>).detail;
    if (!opened) return;

    const model = this.focusModel;
    if (!model) return;

    track(this.std, model, this._viewType, 'OpenedCardStyleSelector', {
      control: 'switch card style',
    });
  };

  private _toggleViewSelector = (e: Event) => {
    const opened = (e as CustomEvent<boolean>).detail;
    if (!opened) return;

    const model = this.focusModel;
    if (!model) return;

    track(this.std, model, this._viewType, 'OpenedViewSelector', {
      control: 'switch view',
    });
  };

  private _trackViewSelected = (type: string) => {
    const model = this.focusModel;
    if (!model) return;

    track(this.std, model, this._viewType, 'SelectedView', {
      control: 'selected view',
      type: `${type} view`,
    });
  };

  /*
   * Caches the more menu items.
   * Currently only supports configuring more menu.
   */
  moreGroups: MenuItemGroup<EmbedCardToolbarContext>[] =
    cloneGroups(BUILT_IN_GROUPS);

  private get _canConvertToEmbedView() {
    // synced doc entry controlled by awareness flag
    if (this.focusModel && isEmbedLinkedDocBlock(this.focusModel)) {
      const isSyncedDocEnabled = this.doc.awarenessStore.getFlag(
        'enable_synced_doc_block'
      );
      if (!isSyncedDocEnabled) {
        return false;
      }
    }

    if (!this.focusBlock) return false;

    return (
      'convertToEmbed' in this.focusBlock ||
      this._embedOptions?.viewType === 'embed'
    );
  }

  private get _canShowUrlOptions() {
    return this.focusModel && 'url' in this.focusModel && this._isCardView;
  }

  private get _embedViewButtonDisabled() {
    if (this.doc.readonly) {
      return true;
    }
    return (
      this.focusModel &&
      this.focusBlock &&
      isEmbedLinkedDocBlock(this.focusModel) &&
      (referenceToNode(this.focusModel) ||
        !!this.focusBlock.closest('affine-embed-synced-doc-block') ||
        this.focusModel.pageId === this.doc.id)
    );
  }

  private get _isCardView() {
    return (
      this.focusModel &&
      (isBookmarkBlock(this.focusModel) ||
        isEmbedLinkedDocBlock(this.focusModel) ||
        this._embedOptions?.viewType === 'card')
    );
  }

  private get _isEmbedView() {
    return (
      this.focusModel &&
      !isBookmarkBlock(this.focusModel) &&
      (isEmbedSyncedDocBlock(this.focusModel) ||
        this._embedOptions?.viewType === 'embed')
    );
  }

  get _openButtonDisabled() {
    return (
      this.focusModel &&
      isEmbedLinkedDocBlock(this.focusModel) &&
      this.focusModel.pageId === this.doc.id
    );
  }

  get _originalDocInfo(): AliasInfo | undefined {
    const model = this.focusModel;
    if (!model) return undefined;

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
    const model = this.focusModel;
    if (!model) return undefined;

    const doc = isInternalEmbedModel(model)
      ? this.std.collection.getDoc(model.pageId)
      : null;

    return doc?.meta?.title || 'Untitled';
  }

  private get _selection() {
    return this.host.selection;
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

  get focusModel(): EmbedModel | undefined {
    return this.focusBlock?.model;
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

  private _cardStyleSelector() {
    const model = this.focusModel;

    if (!model) return nothing;
    if (!this._canShowCardStylePanel(model)) return nothing;

    const theme = this.std.get(ThemeProvider).theme;
    const { EmbedCardHorizontalIcon, EmbedCardListIcon } =
      getEmbedCardIcons(theme);

    const buttons = [
      {
        type: 'horizontal',
        label: 'Large horizontal style',
        icon: EmbedCardHorizontalIcon,
      },
      {
        type: 'list',
        label: 'Small horizontal style',
        icon: EmbedCardListIcon,
      },
    ] as {
      type: EmbedCardStyle;
      label: string;
      icon: TemplateResult<1>;
    }[];

    return html`
      <editor-menu-button
        class="card-style-select"
        .contentPadding=${'8px'}
        .button=${html`
          <editor-icon-button aria-label="Card style" .tooltip=${'Card style'}>
            ${PaletteIcon}
          </editor-icon-button>
        `}
        @toggle=${this._toggleCardStyleSelector}
      >
        <div>
          ${repeat(
            buttons,
            button => button.type,
            ({ type, label, icon }) => html`
              <icon-button
                width="76px"
                height="76px"
                aria-label=${label}
                class=${classMap({
                  selected: model.style === type,
                })}
                @click=${() => this._setEmbedCardStyle(type)}
              >
                ${icon}
                <affine-tooltip .offset=${4}>${label}</affine-tooltip>
              </icon-button>
            `
          )}
        </div>
      </editor-menu-button>
    `;
  }

  private _convertToCardView() {
    if (this._isCardView) {
      return;
    }
    if (!this.focusBlock) {
      return;
    }

    if ('convertToCard' in this.focusBlock) {
      this.focusBlock.convertToCard();
      return;
    }

    if (!this.focusModel || !('url' in this.focusModel)) {
      return;
    }

    const targetModel = this.focusModel;
    const { doc, url, style, caption } = targetModel;

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

    const parent = doc.getParent(targetModel);
    if (!parent) return;
    const index = parent.children.indexOf(targetModel);

    doc.addBlock(
      targetFlavour as never,
      { url, style: targetStyle, caption },
      parent,
      index
    );
    this.std.selection.setGroup('note', []);
    doc.deleteBlock(targetModel);
  }

  private _convertToEmbedView() {
    if (this._isEmbedView) {
      return;
    }

    if (!this.focusBlock) {
      return;
    }

    if ('convertToEmbed' in this.focusBlock) {
      const referenceInfo = this.focusBlock.referenceInfo$.peek();

      this.focusBlock.convertToEmbed();

      if (referenceInfo.title || referenceInfo.description) {
        notifyLinkedDocSwitchedToEmbed(this.std);
      }

      return;
    }

    if (!this.focusModel || !('url' in this.focusModel)) {
      return;
    }

    const targetModel = this.focusModel;
    const { doc, url, style, caption } = targetModel;

    if (!this._embedOptions || this._embedOptions.viewType !== 'embed') {
      return;
    }
    const { flavour, styles } = this._embedOptions;

    const targetStyle = styles.includes(style)
      ? style
      : styles.filter(style => style !== 'vertical' && style !== 'cube')[0];

    const parent = doc.getParent(targetModel);
    if (!parent) return;
    const index = parent.children.indexOf(targetModel);

    doc.addBlock(
      flavour as never,
      { url, style: targetStyle, caption },
      parent,
      index
    );

    this.std.selection.setGroup('note', []);
    doc.deleteBlock(targetModel);
  }

  private _hide() {
    this._resetAbortController();
    this.focusBlock = null;
    this.hide = true;
  }

  private _moreActions() {
    if (!this.focusBlock) return nothing;
    const context = new EmbedCardToolbarContext(
      this.focusBlock,
      this._abortController
    );
    return renderGroups(this.moreGroups, context);
  }

  private _openMenuButton() {
    const buttons: MenuItem[] = [];

    if (
      this.focusModel &&
      (isEmbedLinkedDocBlock(this.focusModel) ||
        isEmbedSyncedDocBlock(this.focusModel))
    ) {
      buttons.push({
        type: 'open-this-doc',
        label: 'Open this doc',
        icon: ExpandFullSmallIcon,
        action: () => this.focusBlock?.open(),
      });
    }

    // open in new tab

    const element = this.focusBlock;
    if (element && isPeekable(element)) {
      buttons.push({
        type: 'open-in-center-peek',
        label: 'Open in center peek',
        icon: CenterPeekIcon,
        action: () => peek(element),
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

  private _setEmbedCardStyle(style: EmbedCardStyle) {
    const model = this.focusModel;
    if (!model) return;

    model.doc.updateBlock(model, { style });
    this.requestUpdate();
    this._abortController.abort();

    track(this.std, model, this._viewType, 'SelectedCardStyle', {
      control: 'select card style',
      type: style,
    });
  }

  private _show() {
    if (!this.focusBlock) {
      return;
    }
    this.hide = false;
    this._abortController.signal.addEventListener(
      'abort',
      autoUpdate(this.focusBlock, this, () => {
        if (!this.focusBlock) {
          return;
        }
        computePosition(this.focusBlock, this, {
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

  private _turnIntoInlineView() {
    if (this.focusBlock && 'covertToInline' in this.focusBlock) {
      this.focusBlock.covertToInline();
      return;
    }

    if (!this.focusModel || !('url' in this.focusModel)) {
      return;
    }

    const targetModel = this.focusModel;
    const { doc, title, caption, url } = targetModel;
    const parent = doc.getParent(targetModel);
    const index = parent?.children.indexOf(targetModel);

    const yText = new DocCollection.Y.Text();
    const insert = title || caption || url;
    yText.insert(0, insert);
    yText.format(0, insert.length, { link: url });
    const text = new doc.Text(yText);
    doc.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    doc.deleteBlock(targetModel);
  }

  private _viewSelector() {
    const buttons = [];

    buttons.push({
      type: 'inline',
      label: 'Inline view',
      action: () => this._turnIntoInlineView(),
      disabled: this.doc.readonly,
    });

    buttons.push({
      type: 'card',
      label: 'Card view',
      action: () => this._convertToCardView(),
      disabled: this.doc.readonly,
    });

    if (this._canConvertToEmbedView || this._isEmbedView) {
      buttons.push({
        type: 'embed',
        label: 'Embed view',
        action: () => this._convertToEmbedView(),
        disabled: this.doc.readonly || this._embedViewButtonDisabled,
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
                  this._hide();
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

  override connectedCallback() {
    super.connectedCallback();

    this.moreGroups = getMoreMenuConfig(this.std).configure(this.moreGroups);

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

        this.focusBlock = block as EmbedBlockComponent;
        this._show();
      })
    );
  }

  override render() {
    if (this.hide) return nothing;

    const model = this.focusModel;
    if (!model) return nothing;

    this._embedOptions =
      'url' in model
        ? this.std.get(EmbedOptionProvider).getEmbedBlockOptions(model.url)
        : null;

    const hasUrl = this._canShowUrlOptions && 'url' in model;

    const buttons = [
      this._openMenuButton(),

      hasUrl
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
              @click=${this.focusBlock?.open}
            >
              <span class="label">${this._originalDocTitle}</span>
            </editor-icon-button>
          `
        : nothing,

      isEmbedHtmlBlock(model)
        ? nothing
        : html`
            <editor-icon-button
              aria-label="Copy link"
              data-testid="copy-link"
              .tooltip=${'Copy link'}
              @click=${this._copyUrl}
            >
              ${CopyIcon}
            </editor-icon-button>

            <editor-icon-button
              aria-label="Edit"
              data-testid="edit"
              .tooltip=${'Edit'}
              ?disabled=${this.doc.readonly}
              @click=${this._openEditPopup}
            >
              ${EditIcon}
            </editor-icon-button>
          `,

      this._viewSelector(),

      this._cardStyleSelector(),

      html`
        <editor-icon-button
          aria-label="Caption"
          .tooltip=${'Add Caption'}
          ?disabled=${this.doc.readonly}
          @click=${this._showCaption}
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
  accessor focusBlock: EmbedBlockComponent | null = null;

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

function track(
  std: BlockStdScope,
  model: EmbedModel,
  viewType: string,
  event: LinkEventType,
  props: Partial<TelemetryEvent>
) {
  std.getOptional(TelemetryProvider)?.track(event, {
    segment: 'toolbar',
    page: 'doc editor',
    module: 'embed card toolbar',
    type: `${viewType} view`,
    category: isInternalEmbedModel(model) ? 'linked doc' : 'link',
    ...props,
  });
}
