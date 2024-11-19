import type { GfxToolsFullOptionValue } from '@blocksuite/block-std/gfx';

import { STROKE_COLORS } from '@blocksuite/affine-model';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { ColorEvent } from '../../panel/color-panel.js';

import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

export class EdgelessTextMenu extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      z-index: -1;
    }
  `;

  override type: GfxToolsFullOptionValue['type'] = 'text';

  override render() {
    if (this.edgelessTool.type !== 'text') return nothing;

    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <edgeless-color-panel
            class="one-way"
            .value=${this.color}
            .palettes=${STROKE_COLORS}
            @select=${(e: ColorEvent) => this.onChange({ color: e.detail })}
          ></edgeless-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor color!: string;

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-menu': EdgelessTextMenu;
  }
}
