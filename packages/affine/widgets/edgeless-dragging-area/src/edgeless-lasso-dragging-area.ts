import {
  DefaultModeDragType,
  DefaultTool,
} from '@blocksuite/affine-block-surface';
import type { RootBlockModel } from '@blocksuite/affine-model';
import { WidgetComponent, WidgetViewExtension } from '@blocksuite/std';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing, unsafeCSS } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

export const EDGELESS_LASSO_DRAGGING_AREA_WIDGET = 'edgeless-lasso-dragging-area';

export class EdgelessLassoDraggingAreaWidget extends WidgetComponent<RootBlockModel> {
  static override styles = css`
    .affine-edgeless-lasso-area {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .affine-edgeless-lasso-path {
      fill: ${unsafeCSS(
        cssVarV2('edgeless/selection/selectionMarqueeBackground', '#1E96EB14')
      )};
      stroke: ${unsafeCSS(
        cssVarV2('edgeless/selection/selectionMarqueeBorder', '#1E96EB')
      )};
      stroke-width: 1;
      stroke-dasharray: 5,5;
    }
  `;

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  private _getPathString(points: [number, number][]): string {
    if (points.length < 2) return '';
    
    const viewportPoints = points.map(([x, y]) => {
      const [vx, vy] = this.gfx.viewport.toViewCoord(x, y);
      return [vx, vy];
    });

    let pathString = `M ${viewportPoints[0][0]} ${viewportPoints[0][1]}`;
    for (let i = 1; i < viewportPoints.length; i++) {
      pathString += ` L ${viewportPoints[i][0]} ${viewportPoints[i][1]}`;
    }
    
    // Close the path by connecting to the start point
    if (viewportPoints.length > 2) {
      pathString += ` L ${viewportPoints[0][0]} ${viewportPoints[0][1]}`;
    }
    
    return pathString;
  }

  override render() {
    const tool = this.gfx.tool.currentTool$.value;

    if (
      !tool ||
      !(tool instanceof DefaultTool) ||
      tool.dragType !== DefaultModeDragType.LassoSelecting
    ) {
      return nothing;
    }

    // Access the lasso path from the tool
    const lassoPath = tool.lassoPath as [number, number][];
    
    if (!lassoPath || lassoPath.length < 2) {
      return nothing;
    }

    const pathString = this._getPathString(lassoPath);

    return html`
      <div class="affine-edgeless-lasso-area">
        <svg width="100%" height="100%">
          <path
            class="affine-edgeless-lasso-path"
            d="${pathString}"
          />
        </svg>
      </div>
    `;
  }
}

export const edgelessLassoDraggingAreaWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_LASSO_DRAGGING_AREA_WIDGET,
  literal`${unsafeStatic(EDGELESS_LASSO_DRAGGING_AREA_WIDGET)}`
); 