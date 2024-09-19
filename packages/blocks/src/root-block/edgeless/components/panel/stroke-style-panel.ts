import { SHAPE_STROKE_COLORS, StrokeStyle } from '@blocksuite/affine-model';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { ColorEvent } from './color-panel.js';

import { type LineStyleEvent, LineStylesPanel } from './line-styles-panel.js';

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
          selectedLineSize: this.strokeWidth,
          selectedLineStyle: this.strokeStyle,
          onClick: e => this.setStrokeStyle(e),
          lineStyles: [StrokeStyle.Solid, StrokeStyle.Dash],
        })}
      </div>
      <editor-toolbar-separator
        data-orientation="horizontal"
      ></editor-toolbar-separator>
      <edgeless-color-panel
        role="listbox"
        aria-label="Border colors"
        .options=${SHAPE_STROKE_COLORS}
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
  accessor strokeColor!: string;

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
