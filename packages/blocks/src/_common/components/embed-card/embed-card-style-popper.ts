import type {
  BookmarkBlockModel,
  EmbedGithubModel,
  EmbedLinkedDocModel,
} from '@blocksuite/affine-model';

import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedCardStyle } from '../../types.js';

import { getEmbedCardIcons } from '../../utils/url.js';

export class EmbedCardStyleMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .embed-card-style-menu {
      box-sizing: border-box;
      padding-bottom: 8px;
    }

    .embed-card-style-menu-container {
      border-radius: 8px;
      padding: 8px;
      gap: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .embed-card-style-menu-container > icon-button {
      padding: var(--1, 0px);
    }

    .embed-card-style-menu-container > icon-button.selected {
      border: 1px solid var(--affine-brand-color);
    }
  `;

  private _setEmbedCardStyle(style: EmbedCardStyle) {
    this.model.doc.updateBlock(this.model, { style });
    this.requestUpdate();
    this.abortController.abort();
  }

  override render() {
    const { EmbedCardHorizontalIcon, EmbedCardListIcon } = getEmbedCardIcons();
    return html`
      <div class="embed-card-style-menu">
        <div
          class="embed-card-style-menu-container"
          @pointerdown=${(e: MouseEvent) => e.stopPropagation()}
        >
          <icon-button
            width="76px"
            height="76px"
            class=${classMap({
              selected: this.model.style === 'horizontal',
              'card-style-button-horizontal': true,
            })}
            @click=${() => this._setEmbedCardStyle('horizontal')}
          >
            ${EmbedCardHorizontalIcon}
            <affine-tooltip .offset=${4}
              >${'Large horizontal style'}</affine-tooltip
            >
          </icon-button>

          <icon-button
            width="76px"
            height="76px"
            class=${classMap({
              selected: this.model.style === 'list',
              'card-style-button-list': true,
            })}
            @click=${() => this._setEmbedCardStyle('list')}
          >
            ${EmbedCardListIcon}
            <affine-tooltip .offset=${4}
              >${'Small horizontal style'}</affine-tooltip
            >
          </icon-button>
        </div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor model!: BookmarkBlockModel | EmbedGithubModel | EmbedLinkedDocModel;
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-style-menu': EmbedCardStyleMenu;
  }
}
