import '../../../../_common/components/button.js';
import '../../../../_common/components/tooltip/tooltip.js';
import './color-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import { StrokeStyle } from '../../../../surface-block/consts.js';
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
  accessor strokeWidth!: number;

  @property({ attribute: false })
  accessor strokeColor!: CssVariableName;

  @property({ attribute: false })
  accessor strokeStyle!: StrokeStyle;

  @property({ attribute: false })
  accessor setStrokeStyle!: (e: LineStyleEvent) => void;

  @property({ attribute: false })
  accessor setStrokeColor!: (e: ColorEvent) => void;

  @property({ attribute: false })
  accessor hollowCircle: boolean | undefined = undefined;

  override render() {
    return html`
      <div class="line-styles">
        ${LineStylesPanel({
          selectedLineSize: this.strokeWidth,
          selectedLineStyle: this.strokeStyle,
          onClick: e => this.setStrokeStyle(e),
          lineStyles: [StrokeStyle.Solid, StrokeStyle.Dash],
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
