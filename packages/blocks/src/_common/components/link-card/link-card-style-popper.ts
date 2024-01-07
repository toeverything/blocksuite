import './../button';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { LinkCardStyle } from '../../types.js';
import { getLinkCardIcons } from '../../utils/url.js';

@customElement('link-card-style-menu')
export class LinkCardStyleMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      border-radius: 8px;
      padding: 8px;
      gap: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    icon-button {
      padding: var(--1, 0px);
    }

    icon-button.selected {
      border: 1px solid var(--affine-brand-color);
    }
  `;

  @property({ attribute: false })
  model!: BookmarkBlockModel | EmbedGithubModel;

  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  abortController!: AbortController;

  private _setLinkCardStyle(style: LinkCardStyle) {
    this.model.page.updateBlock(this.model, { style });
    this.requestUpdate();
    this.abortController.abort();
  }

  override render() {
    const { LinkCardHorizontalIcon, LinkCardListIcon } = getLinkCardIcons();
    return html`
      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.model.style === 'horizontal',
        })}
        @click=${() => this._setLinkCardStyle('horizontal')}
      >
        ${LinkCardHorizontalIcon}
        <affine-tooltip .offset=${4}
          >${'Large horizontal style'}</affine-tooltip
        >
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.model.style === 'list',
        })}
        @click=${() => this._setLinkCardStyle('list')}
      >
        ${LinkCardListIcon}
        <affine-tooltip .offset=${4}
          >${'Small horizontal style'}</affine-tooltip
        >
      </icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'link-card-style-menu': LinkCardStyleMenu;
  }
}
