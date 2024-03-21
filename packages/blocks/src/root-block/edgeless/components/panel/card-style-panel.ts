import '../../../../_common/components/button.js';
import '../../../../_common/components/tooltip/tooltip.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EmbedCardStyle } from '../../../../_common/types.js';

@customElement('card-style-panel')
export class CardStylePanel extends WithDisposable(LitElement) {
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
  options!: {
    style: EmbedCardStyle;
    Icon: TemplateResult<1>;
    tooltip: string;
  }[];

  @property({ attribute: false })
  onSelect!: (value: EmbedCardStyle) => void;

  override render() {
    const options = this.options;
    if (!options || !options.length) return nothing;

    return repeat(
      options,
      options => options.style,
      ({ style, Icon, tooltip }) =>
        html`<icon-button
          width="76px"
          height="76px"
          class=${classMap({
            selected: this.value === style,
          })}
          @click=${() => this.onSelect(style)}
        >
          ${Icon}
          <affine-tooltip .offset=${4}>${tooltip}</affine-tooltip>
        </icon-button>`
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'card-style-panel': CardStylePanel;
  }
}
