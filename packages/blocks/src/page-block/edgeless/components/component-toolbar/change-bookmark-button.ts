import '../buttons/tool-icon-button.js';
import '../panel/bookmark-card-style-panel';

import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { toast } from '../../../../_common/components/toast.js';
import { BookmarkIcon } from '../../../../_common/icons/edgeless.js';
import {
  CopyIcon,
  EditIcon,
  EmbedWebIcon,
  LinkIcon,
  PaletteIcon,
} from '../../../../_common/icons/text.js';
import { toggleBookmarkEditModal } from '../../../../bookmark-block/components/index.js';
import type {
  BookmarkBlockComponent,
  BookmarkBlockType,
} from '../../../../bookmark-block/index.js';
import {
  BookmarkHeight,
  BookmarkWidth,
} from '../../../../bookmark-block/styles.js';
import { Bound } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { createButtonPopper } from '../utils.js';

@customElement('edgeless-change-bookmark-button')
export class EdgelessChangeBookmarkButton extends WithDisposable(LitElement) {
  static override styles = css`
    .change-bookmark-container {
      display: flex;
      align-items: center;
    }

    .change-bookmark-button {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .change-bookmark-button.url {
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

    .change-bookmark-button.url > span {
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

    .change-bookmark-button-view-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 2px;
      border-radius: 6px;
      background: var(--affine-hover-color);
      margin-right: 12px;
    }
    .change-bookmark-button-view-selector .change-bookmark-button {
      width: 24px;
      height: 24px;
    }
    .change-bookmark-button-view-selector > icon-button {
      padding: 0px;
    }
    .change-bookmark-button-view-selector .current-view {
      background: var(--affine-background-overlay-panel-color);
      border-radius: 6px;
    }

    component-toolbar-menu-divider {
      height: 24px;
      margin: 0 12px;
    }

    bookmark-card-style-panel {
      display: none;
    }
    bookmark-card-style-panel[data-show] {
      display: flex;
    }
  `;

  @property({ attribute: false })
  bookmark!: BookmarkBlockComponent;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @state()
  private _showPopper = false;

  @query('.change-bookmark-button.card-style')
  private _bookmarkCardStyleButton!: HTMLDivElement;
  @query('bookmark-card-style-panel')
  private _bookmarkCardStylePanel!: HTMLDivElement;
  private _bookmarkCardStylePopper: ReturnType<
    typeof createButtonPopper
  > | null = null;

  private get _bookmarkModel() {
    return this.bookmark.model;
  }

  private _copyUrl() {
    navigator.clipboard.writeText(this._bookmarkModel.url).catch(console.error);
    toast('Copied link to clipboard');
    this.surface.selection.clear();
  }

  private _setBookmarkStyle(style: BookmarkBlockType) {
    const bounds = Bound.deserialize(this._bookmarkModel.xywh);
    bounds.w = BookmarkWidth[style];
    bounds.h = BookmarkHeight[style];
    const xywh = bounds.serialize();
    this._bookmarkModel.page.updateBlock(this._bookmarkModel, { style, xywh });
    this._bookmarkCardStylePopper?.hide();
  }

  override firstUpdated(changedProperties: Map<string, unknown>) {
    this._bookmarkCardStylePopper = createButtonPopper(
      this._bookmarkCardStyleButton,
      this._bookmarkCardStylePanel,
      ({ display }) => {
        this._showPopper = display === 'show';
      }
    );
    this._disposables.add(this._bookmarkCardStylePopper);

    super.firstUpdated(changedProperties);
  }

  override render() {
    const { style } = this._bookmarkModel;
    return html`<div class="change-bookmark-container">
      <div class="change-bookmark-button url" @click=${() => this._copyUrl()}>
        <affine-tooltip .offset=${12}>Click to copy link</affine-tooltip>
        <span>${this._bookmarkModel.url}</span>
      </div>

      <edgeless-tool-icon-button
        .tooltip=${'Click to copy link'}
        class="change-bookmark-button copy"
        ?disabled=${this.page.readonly}
        @click=${() => this._copyUrl()}
      >
        ${CopyIcon}
      </edgeless-tool-icon-button>

      <edgeless-tool-icon-button
        .tooltip=${'Edit'}
        class="change-bookmark-button edit"
        ?disabled=${this.page.readonly}
        @click=${() => toggleBookmarkEditModal(this.bookmark)}
      >
        ${EditIcon}
      </edgeless-tool-icon-button>

      <component-toolbar-menu-divider
        .vertical=${true}
      ></component-toolbar-menu-divider>

      <div class="change-bookmark-button-view-selector">
        <edgeless-tool-icon-button
          class="change-bookmark-button link"
          .tooltip=${'Link view'}
          ?disabled=${this.page.readonly}
          .iconContainerPadding=${2}
          .hover=${false}
        >
          ${LinkIcon}
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="change-bookmark-button card current-view"
          .tooltip=${'Card view'}
          ?disabled=${this.page.readonly}
          .iconContainerPadding=${2}
          .hover=${false}
        >
          ${BookmarkIcon}
        </edgeless-tool-icon-button>

        <edgeless-tool-icon-button
          class="change-bookmark-button embed"
          .tooltip=${'Embed view'}
          ?disabled=${this.page.readonly}
          .iconContainerPadding=${2}
          .hover=${false}
        >
          ${EmbedWebIcon}
        </edgeless-tool-icon-button>
      </div>

      <div class="change-bookmark-button card-style">
        <edgeless-tool-icon-button
          .tooltip=${this._showPopper ? '' : 'Card style'}
          ?disabled=${this.page.readonly}
          @click=${() => this._bookmarkCardStylePopper?.toggle()}
        >
          ${PaletteIcon}
        </edgeless-tool-icon-button>
      </div>
      <bookmark-card-style-panel
        .value=${style}
        .onSelect=${(value: BookmarkBlockType) => this._setBookmarkStyle(value)}
      >
      </bookmark-card-style-panel>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-bookmark-button': EdgelessChangeBookmarkButton;
  }
}
