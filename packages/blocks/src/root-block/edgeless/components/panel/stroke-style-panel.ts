import '../../../../_common/components/button.js';
import '../../../../_common/components/tooltip/tooltip.js';
import './color-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { STROKE_COLORS } from '../../../../surface-block/elements/shape/consts.js';
import type { ColorEvent } from './color-panel.js';
import { type LineStyleEvent, LineStylesPanel } from './line-styles-panel.js';

@customElement('stroke-style-panel')
export class StrokeStylePanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .line-styles {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
    }
  `;

  @property({ attribute: false })
  strokeWidth!: number;

  @property({ attribute: false })
  strokeColor!: CssVariableName;

  @property({ attribute: false })
  strokeStyle!: 'solid' | 'dash' | 'none';

  @property({ attribute: false })
  setStrokeStyle!: (e: LineStyleEvent) => void;

  @property({ attribute: false })
  setStrokeColor!: (e: ColorEvent) => void;

  @property({ attribute: false })
  hollowCircle?: boolean;

  override render() {
    return html`
      <div class="line-styles">
        ${LineStylesPanel({
          selectedLineSize: this.strokeWidth,
          selectedLineStyle: this.strokeStyle,
          onClick: e => this.setStrokeStyle(e),
          lineStyle: ['solid', 'dash'],
        })}
      </div>
      <edgeless-menu-divider
        data-orientation="horizontal"
      ></edgeless-menu-divider>
      <edgeless-color-panel
        role="listbox"
        aria-label="Border colors"
        .options=${STROKE_COLORS}
        .value=${this.strokeColor}
        .hollowCircle=${this.hollowCircle}
        @select=${(e: ColorEvent) => this.setStrokeColor(e)}
      >
      </edgeless-color-panel>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'stroke-style-panel': StrokeStylePanel;
  }
}
