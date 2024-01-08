import '../buttons/tool-icon-button.js';
import '../panel/link-card-style-panel';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { toggleLinkCardEditModal } from '../../../../_common/components/link-card/modal/link-card-edit-modal.js';
import { toast } from '../../../../_common/components/toast.js';
import {
  LINK_CARD_HEIGHT,
  LINK_CARD_WIDTH,
} from '../../../../_common/consts.js';
import { BookmarkIcon } from '../../../../_common/icons/edgeless.js';
import {
  CopyIcon,
  EditIcon,
  EmbedWebIcon,
  PaletteIcon,
} from '../../../../_common/icons/text.js';
import type { LinkCardStyle } from '../../../../_common/types.js';
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

@customElement('edgeless-change-link-card-button')
export class EdgelessChangeLinkCardButton extends WithDisposable(LitElement) {
  static override styles = css`
    .change-link-card-container {
      display: flex;
      align-items: center;
    }

    .change-link-card-button {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .change-link-card-button.url {
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

    .change-link-card-button.url > span {
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

    .change-link-card-view-style {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .change-link-card-button-view-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 2px;
      border-radius: 6px;
      background: var(--affine-hover-color);
    }
    .change-link-card-button-view-selector .change-link-card-button {
      width: 24px;
      height: 24px;
    }
    .change-link-card-button-view-selector > icon-button {
      padding: 0px;
    }
    .change-link-card-button-view-selector .current-view {
      background: var(--affine-background-overlay-panel-color);
      border-radius: 6px;
    }

    component-toolbar-menu-divider {
      height: 24px;
      margin: 0 12px;
    }

    link-card-style-panel {
      display: none;
    }
    link-card-style-panel[data-show] {
      display: flex;
    }
  `;

  @property({ attribute: false })
  linkCard!:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @state()
  private _showPopper = false;

  @query('.change-link-card-button.card-style')
  private _linkCardStyleButton!: HTMLDivElement;

  @query('link-card-style-panel')
  private _linkCardStylePanel!: HTMLDivElement;

  private _linkCardStylePopper: ReturnType<typeof createButtonPopper> | null =
    null;

  private get _model() {
    return this.linkCard.model;
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

  private _setLinkCardStyle(style: LinkCardStyle) {
    const bounds = Bound.deserialize(this._model.xywh);
    bounds.w = LINK_CARD_WIDTH[style];
    bounds.h = LINK_CARD_HEIGHT[style];
    const xywh = bounds.serialize();
    this._model.page.updateBlock(this._model, { style, xywh });
    this._linkCardStylePopper?.hide();
  }

  private _convertToCardView() {
    if (isBookmarkBlock(this._model)) return;
    const { url, xywh, style } = this._model;

    const targetStyle = BookmarkStyles.includes(style)
      ? style
      : BookmarkStyles[0];

    const bound = Bound.deserialize(xywh);
    bound.w = LINK_CARD_WIDTH[targetStyle];
    bound.h = LINK_CARD_HEIGHT[targetStyle];

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
    bound.w = LINK_CARD_WIDTH[targetStyle];
    bound.h = LINK_CARD_HEIGHT[targetStyle];

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
      this._linkCardStylePopper = createButtonPopper(
        this._linkCardStyleButton,
        this._linkCardStylePanel,
        ({ display }) => {
          this._showPopper = display === 'show';
        }
      );
      this._disposables.add(this._linkCardStylePopper);
    }

    super.firstUpdated(changedProperties);
  }

  override render() {
    const { style } = this._model;
    return html`
      <div class="change-link-card-container">
        <div
          class="change-link-card-button url"
          @click=${() => this._copyUrl()}
        >
          <affine-tooltip .offset=${12}>Click to copy link</affine-tooltip>
          <span>${this._model.url}</span>
        </div>

        <edgeless-tool-icon-button
          .tooltip=${'Click to copy link'}
          class="change-link-card-button copy"
          ?disabled=${this.page.readonly}
          @click=${() => this._copyUrl()}
        >
          ${CopyIcon}
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          .tooltip=${'Edit'}
          class="change-link-card-button edit"
          ?disabled=${this.page.readonly}
          @click=${() => toggleLinkCardEditModal(this.linkCard)}
        >
          ${EditIcon}
        </edgeless-tool-icon-button>

        <component-toolbar-menu-divider
          .vertical=${true}
        ></component-toolbar-menu-divider>

        <div class="change-link-card-view-style">
          ${isEmbeddedBlock(this._model) || this._canConvertToEmbedView()
            ? html`
                <div class="change-link-card-button-view-selector">
                  <edgeless-tool-icon-button
                    class=${classMap({
                      'change-link-card-button': true,
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
                      'change-link-card-button': true,
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
                <div class="change-link-card-button card-style">
                  <edgeless-tool-icon-button
                    .tooltip=${this._showPopper ? '' : 'Card style'}
                    ?disabled=${this.page.readonly}
                    @click=${() => this._linkCardStylePopper?.toggle()}
                  >
                    ${PaletteIcon}
                  </edgeless-tool-icon-button>
                </div>
              `
            : nothing}

          <link-card-style-panel
            .value=${style}
            .onSelect=${(value: LinkCardStyle) => this._setLinkCardStyle(value)}
          >
          </link-card-style-panel>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-link-card-button': EdgelessChangeLinkCardButton;
  }
}
