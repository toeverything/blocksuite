import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

import {
  DefaultModeDragType,
  DefaultTool,
} from '../../gfx-tool/default-tool.js';

export class EdgelessDraggingAreaRect extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = css`
    .affine-edgeless-dragging-area {
      position: absolute;
      background: ${unsafeCSS(
        cssVarV2('edgeless/selection/selectionMarqueeBackground', '#1E96EB14')
      )};
      box-sizing: border-box;
      border-width: 1px;
      border-style: solid;
      border-color: ${unsafeCSS(
        cssVarV2('edgeless/selection/selectionMarqueeBorder', '#1E96EB')
      )};

      z-index: 1;
      pointer-events: none;
    }
  `;

  protected override render() {
    const rect = this.edgeless.gfx.tool.draggingViewArea$.value;
    const tool = this.edgeless.gfx.tool.currentTool$.value;

    if (
      rect.w === 0 ||
      rect.h === 0 ||
      !(tool instanceof DefaultTool) ||
      tool.dragType !== DefaultModeDragType.Selecting
    )
      return nothing;

    const style = {
      left: rect.x + 'px',
      top: rect.y + 'px',
      width: rect.w + 'px',
      height: rect.h + 'px',
    };

    return html`
      <div class="affine-edgeless-dragging-area" style=${styleMap(style)}></div>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-dragging-area-rect': EdgelessDraggingAreaRect;
  }
}
