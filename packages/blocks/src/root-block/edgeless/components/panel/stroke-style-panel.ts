import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import type { ColorEvent } from './color-panel.js';

import '../../../../_common/components/button.js';
import '../../../../_common/components/toolbar/separator.js';
import '../../../../_common/components/tooltip/tooltip.js';
import { StrokeStyle } from '../../../../surface-block/consts.js';
import { STROKE_COLORS } from '../../../../surface-block/elements/shape/consts.js';
import './color-panel.js';
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

  override render() {
    return html`
      <div class="line-styles">
        ${LineStylesPanel({
          lineStyles: [StrokeStyle.Solid, StrokeStyle.Dash],
          onClick: e => this.setStrokeStyle(e),
          selectedLineSize: this.strokeWidth,
          selectedLineStyle: this.strokeStyle,
        })}
      </div>
      <editor-toolbar-separator
        data-orientation="horizontal"
      ></editor-toolbar-separator>
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

  @property({ attribute: false })
  accessor hollowCircle: boolean | undefined = undefined;

  @property({ attribute: false })
  accessor setStrokeColor!: (e: ColorEvent) => void;

  @property({ attribute: false })
  accessor setStrokeStyle!: (e: LineStyleEvent) => void;

  @property({ attribute: false })
  accessor strokeColor!: CssVariableName;

  @property({ attribute: false })
  accessor strokeStyle!: StrokeStyle;

  @property({ attribute: false })
  accessor strokeWidth!: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'stroke-style-panel': StrokeStylePanel;
  }
}
