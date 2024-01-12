import '../buttons/tool-icon-button.js';
import '../panel/embed-card-style-panel.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
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
  PaletteIcon,
} from '../../../../_common/icons/text.js';
import type { EmbedCardStyle } from '../../../../_common/types.js';
import type { BookmarkBlockComponent } from '../../../../bookmark-block/bookmark-block.js';
import { BookmarkStyles } from '../../../../bookmark-block/bookmark-model.js';
import type { EmbedGithubBlockComponent } from '../../../../embed-github-block/embed-github-block.js';
import type { EmbedYoutubeBlockComponent } from '../../../../embed-youtube-block/embed-youtube-block.js';
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
  embedCard!:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @state()
  private _showPopper = false;

  @query('.change-embed-card-button.card-style')
  private _embedCardStyleButton!: HTMLDivElement;

  @query('embed-card-style-panel')
  private _embedCardStylePanel!: HTMLDivElement;

  private _embedCardStylePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private get _model() {
    return this.embedCard.model;
  }

  private get _pageService() {
    const pageService = this.surface.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    return pageService;
  }

  private get _canShowCardStylePanel() {
    return isBookmarkBlock(this._model) || isEmbedGithubBlock(this._model);
  }

  private _copyUrl() {
    navigator.clipboard.writeText(this._model.url).catch(console.error);
    toast('Copied link to clipboard');
    this.surface.selection.clear();
  }

  private _setEmbedCardStyle(style: EmbedCardStyle) {
    const bounds = Bound.deserialize(this._model.xywh);
    bounds.w = EMBED_CARD_WIDTH[style];
    bounds.h = EMBED_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this._model.page.updateBlock(this._model, { style, xywh });
    this._embedCardStylePopper?.hide();
  }

  private _convertToCardView() {
    if (isBookmarkBlock(this._model)) return;
    const { url, xywh, style } = this._model;

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
    this.page.deleteBlock(this._model);
  }

  private _canConvertToEmbedView() {
    const { url } = this._model;
    return !!this._pageService.getEmbedBlockOptions(url);
  }

  private _convertToEmbedView() {
    const { url, xywh, style } = this._model;
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
    this.page.deleteBlock(this._model);
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
    const { style } = this._model;
    return html`
      <div class="change-embed-card-container">
        <div
          class="change-embed-card-button url"
          @click=${() => this._copyUrl()}
        >
          <affine-tooltip .offset=${12}>Click to copy link</affine-tooltip>
          <span>${this._model.url}</span>
        </div>

        <edgeless-tool-icon-button
          .tooltip=${'Click to copy link'}
          class="change-embed-card-button copy"
          ?disabled=${this.page.readonly}
          @click=${() => this._copyUrl()}
        >
          ${CopyIcon}
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          .tooltip=${'Edit'}
          class="change-embed-card-button edit"
          ?disabled=${this.page.readonly}
          @click=${() => toggleEmbedCardEditModal(this.embedCard)}
        >
          ${EditIcon}
        </edgeless-tool-icon-button>

        <component-toolbar-menu-divider
          .vertical=${true}
        ></component-toolbar-menu-divider>

        <div class="change-embed-card-view-style">
          ${isEmbeddedBlock(this._model) || this._canConvertToEmbedView()
            ? html`
                <div class="change-embed-card-button-view-selector">
                  <edgeless-tool-icon-button
                    class=${classMap({
                      'change-embed-card-button': true,
                      card: true,
                      'current-view': isBookmarkBlock(this._model),
                    })}
                    .tooltip=${'Card view'}
                    ?disabled=${this.page.readonly}
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
                      'current-view': isEmbeddedBlock(this._model),
                    })}
                    .tooltip=${'Embed view'}
                    ?disabled=${this.page.readonly}
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
                    ?disabled=${this.page.readonly}
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
