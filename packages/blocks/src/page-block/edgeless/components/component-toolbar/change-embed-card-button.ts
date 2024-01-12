import '../buttons/tool-icon-button.js';
import '../panel/embed-card-style-panel.js';

import type { BlockStdScope } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { toggleEmbedCardEditModal } from '../../../../_common/components/embed-card/modal/embed-card-edit-modal.js';
import { toast } from '../../../../_common/components/toast.js';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../../_common/consts.js';
import { BookmarkIcon } from '../../../../_common/icons/edgeless.js';
import {
  CopyIcon,
  EditIcon,
  EmbedWebIcon,
  OpenIcon,
  PaletteIcon,
} from '../../../../_common/icons/text.js';
import type { EmbedCardStyle } from '../../../../_common/types.js';
import type { BookmarkBlockModel } from '../../../../bookmark-block/bookmark-model.js';
import { BookmarkStyles } from '../../../../bookmark-block/bookmark-model.js';
import type {
  EmbedGithubBlockComponent,
  EmbedGithubModel,
} from '../../../../embed-github-block/index.js';
import type { EmbedLinkedDocBlockComponent } from '../../../../embed-linked-doc-block/embed-linked-doc-block.js';
import type { EmbedLinkedDocModel } from '../../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedYoutubeBlockComponent } from '../../../../embed-youtube-block/embed-youtube-block.js';
import type { EmbedYoutubeModel } from '../../../../embed-youtube-block/embed-youtube-model.js';
import type { BookmarkBlockComponent } from '../../../../index.js';
import {
  Bound,
  type EdgelessBlockType,
} from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { PageService } from '../../../page-service.js';
import {
  isBookmarkBlock,
  isEmbeddedBlock,
  isEmbedGithubBlock,
  isEmbedLinkedDocBlock,
} from '../../utils/query.js';
import { createButtonPopper } from '../utils.js';

@customElement('edgeless-change-embed-card-button')
export class EdgelessChangeEmbedCardButton extends WithDisposable(LitElement) {
  static override styles = css`
    .change-embed-card-container {
      display: flex;
      align-items: center;
    }

    .change-embed-card-button {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
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
      font-family: var(--affine-font-family);
      font-size: 15px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
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
      margin: 0 12px;
    }

    embed-card-style-panel {
      display: none;
    }
    embed-card-style-panel[data-show] {
      display: flex;
    }
  `;

  @property({ attribute: false })
  model!:
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedLinkedDocModel;

  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @state()
  private _showPopper = false;

  @query('.change-embed-card-button.card-style')
  private _embedCardStyleButton!: HTMLDivElement;

  @query('embed-card-style-panel')
  private _embedCardStylePanel!: HTMLDivElement;

  private get _page() {
    return this.model.page;
  }

  private _embedCardStylePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private get _pageService() {
    const pageService = this.surface.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    return pageService;
  }

  private get _canShowCardStylePanel() {
    return (
      isBookmarkBlock(this.model) ||
      isEmbedGithubBlock(this.model) ||
      isEmbedLinkedDocBlock(this.model)
    );
  }

  private _open() {
    const blockSelection =
      this.surface.edgeless.selectionManager.selections.filter(sel =>
        sel.elements.includes(this.model.id)
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
      | EmbedLinkedDocBlockComponent
      | null;
    assertExists(blockElement);
    blockElement.open();
  }

  private _copyUrl() {
    if (!('url' in this.model)) {
      return;
    }

    navigator.clipboard.writeText(this.model.url).catch(console.error);
    toast('Copied link to clipboard');
    this.surface.selection.clear();
  }

  private _setEmbedCardStyle(style: EmbedCardStyle) {
    const bounds = Bound.deserialize(this.model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this.model.page.updateBlock(this.model, { style, xywh });
    this._embedCardStylePopper?.hide();
  }

  private _convertToCardView() {
    if (isBookmarkBlock(this.model) || isEmbedLinkedDocBlock(this.model))
      return;
    const { url, xywh, style } = this.model;

    const targetStyle = BookmarkStyles.includes(style)
      ? style
      : BookmarkStyles[0];

    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[targetStyle];
    bound.h = EMBED_CARD_HEIGHT[targetStyle];

    const blockId = this.surface.addElement(
      'affine:bookmark',
      { url, xywh: bound.serialize(), style: targetStyle },
      this.surface.model
    );
    this.surface.edgeless.selectionManager.set({
      editing: false,
      elements: [blockId],
    });
    this._page.deleteBlock(this.model);
  }

  private get _canShowOpenButton() {
    return isEmbedLinkedDocBlock(this.model);
  }

  private get _canShowUrlOptions() {
    return (
      'url' in this.model &&
      (isBookmarkBlock(this.model) ||
        isEmbedGithubBlock(this.model) ||
        isEmbedLinkedDocBlock(this.model))
    );
  }

  private get _canConvertToEmbedView() {
    if (isEmbedLinkedDocBlock(this.model)) {
      return false;
    }

    if (isEmbeddedBlock(this.model)) {
      return true;
    }

    const { url } = this.model;
    return !!this._pageService.getEmbedBlockOptions(url);
  }

  private _convertToEmbedView() {
    if (isEmbedLinkedDocBlock(this.model)) {
      return;
    }

    const { url, xywh, style } = this.model;
    const embedOptions = this._pageService.getEmbedBlockOptions(url);
    if (!embedOptions) return;

    const { flavour, styles } = embedOptions;

    const targetStyle = styles.includes(style) ? style : styles[0];

    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[targetStyle];
    bound.h = EMBED_CARD_HEIGHT[targetStyle];

    const blockId = this.surface.addElement(
      flavour as EdgelessBlockType,
      {
        url,
        xywh: bound.serialize(),
        style: targetStyle,
      },
      this.surface.model
    );
    this.surface.edgeless.selectionManager.set({
      editing: false,
      elements: [blockId],
    });
    this._page.deleteBlock(this.model);
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    if (this._canShowCardStylePanel) {
      this._embedCardStylePopper = createButtonPopper(
        this._embedCardStyleButton,
        this._embedCardStylePanel,
        ({ display }) => {
          this._showPopper = display === 'show';
        }
      );
      this._disposables.add(this._embedCardStylePopper);
    }

    super.firstUpdated(changedProperties);
  }

  override render() {
    const model = this.model;
    const style = model.style;

    return html`
      <div class="change-embed-card-container">
        ${this._canShowUrlOptions && 'url' in model
          ? html`<div
                class="change-embed-card-button url"
                @click=${this._copyUrl}
              >
                <affine-tooltip .offset=${12}
                  >Click to copy link</affine-tooltip
                >
                <span>${model.url}</span>
              </div>

              <edgeless-tool-icon-button
                .tooltip=${'Click to copy link'}
                class="change-embed-card-button copy"
                ?disabled=${this._page.readonly}
                @click=${() => this._copyUrl()}
              >
                ${CopyIcon}
              </edgeless-tool-icon-button>

              <edgeless-tool-icon-button
                .tooltip=${'Edit'}
                class="change-embed-card-button edit"
                ?disabled=${this._page.readonly}
                @click=${() =>
                  toggleEmbedCardEditModal(this.std.host as EditorHost, model)}
              >
                ${EditIcon}
              </edgeless-tool-icon-button>

              <component-toolbar-menu-divider
                .vertical=${true}
              ></component-toolbar-menu-divider>`
          : nothing}
        ${this._canShowOpenButton
          ? html`<edgeless-tool-icon-button
                .tooltip=${'Open'}
                class="change-embed-card-button open"
                @click=${this._open}
              >
                ${OpenIcon}
              </edgeless-tool-icon-button>

              <component-toolbar-menu-divider
                .vertical=${true}
              ></component-toolbar-menu-divider>`
          : nothing}

        <div class="change-embed-card-view-style">
          ${this._canConvertToEmbedView
            ? html`
                <div class="change-embed-card-button-view-selector">
                  <edgeless-tool-icon-button
                    class=${classMap({
                      'change-embed-card-button': true,
                      card: true,
                      'current-view': isBookmarkBlock(model),
                    })}
                    .tooltip=${'Card view'}
                    ?disabled=${this._page.readonly}
                    .iconContainerPadding=${2}
                    .hover=${false}
                    @click=${() => this._convertToCardView()}
                  >
                    ${BookmarkIcon}
                  </edgeless-tool-icon-button>

                  <edgeless-tool-icon-button
                    class=${classMap({
                      'change-embed-card-button': true,
                      embed: true,
                      'current-view': isEmbeddedBlock(model),
                    })}
                    .tooltip=${'Embed view'}
                    ?disabled=${this._page.readonly}
                    .iconContainerPadding=${2}
                    .hover=${false}
                    @click=${() => this._convertToEmbedView()}
                  >
                    ${EmbedWebIcon}
                  </edgeless-tool-icon-button>
                </div>
              `
            : nothing}
          ${this._canShowCardStylePanel
            ? html`
                <div class="change-embed-card-button card-style">
                  <edgeless-tool-icon-button
                    .tooltip=${this._showPopper ? '' : 'Card style'}
                    ?disabled=${this._page.readonly}
                    @click=${() => this._embedCardStylePopper?.toggle()}
                  >
                    ${PaletteIcon}
                  </edgeless-tool-icon-button>
                </div>
              `
            : nothing}

          <embed-card-style-panel
            .value=${style}
            .onSelect=${(value: EmbedCardStyle) =>
              this._setEmbedCardStyle(value)}
          >
          </embed-card-style-panel>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-embed-card-button': EdgelessChangeEmbedCardButton;
  }
}
