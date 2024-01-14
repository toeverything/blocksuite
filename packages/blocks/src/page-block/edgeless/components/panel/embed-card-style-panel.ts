import '../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedCardStyle } from '../../../../_common/types.js';
import { getEmbedCardIcons } from '../../../../_common/utils/url.js';

@customElement('embed-card-style-panel')
export class EmbedCardStylePanel extends WithDisposable(LitElement) {
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
  onSelect!: (value: EmbedCardStyle) => void;

  override render() {
    const {
      EmbedCardHorizontalIcon,
      EmbedCardListIcon,
      EmbedCardVerticalIcon,
      EmbedCardCubeIcon,
    } = getEmbedCardIcons();
    return html`
      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.value === 'horizontal',
        })}
        @click=${() => this.onSelect('horizontal')}
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
          selected: this.value === 'list',
        })}
        @click=${() => this.onSelect('list')}
      >
        ${EmbedCardListIcon}
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
        ${EmbedCardVerticalIcon}
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
        ${EmbedCardCubeIcon}
        <affine-tooltip .offset=${4}>${'Small vertical style'}</affine-tooltip>
      </icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-style-panel': EmbedCardStylePanel;
  }
}
