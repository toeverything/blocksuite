import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { LinkCardStyle } from '../../../../_common/types.js';
import { getLinkCardIcons } from '../../../../_common/utils/url.js';

@customElement('link-card-style-panel')
export class LinkCardStylePanel extends WithDisposable(LitElement) {
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
  value!: string;

  @property({ attribute: false })
  onSelect!: (value: LinkCardStyle) => void;

  override render() {
    const {
      LinkCardHorizontalIcon,
      LinkCardListIcon,
      LinkCardVerticalIcon,
      LinkCardCubeIcon,
    } = getLinkCardIcons();
    return html`
      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'horizontal',
        })}
        @click=${() => this.onSelect('horizontal')}
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
          selected: this.value === 'list',
        })}
        @click=${() => this.onSelect('list')}
      >
        ${LinkCardListIcon}
        <affine-tooltip .offset=${4}
          >${'Small horizontal style'}</affine-tooltip
        >
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'vertical',
        })}
        @click=${() => this.onSelect('vertical')}
      >
        ${LinkCardVerticalIcon}
        <affine-tooltip .offset=${4}>${'Large vertical style'}</affine-tooltip>
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'cube',
        })}
        @click=${() => this.onSelect('cube')}
      >
        ${LinkCardCubeIcon}
        <affine-tooltip .offset=${4}>${'Small vertical style'}</affine-tooltip>
      </icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'link-card-style-panel': LinkCardStylePanel;
  }
}
