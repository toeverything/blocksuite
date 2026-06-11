import { type ShapeName, ShapeType } from '@labre/affine-model';
import { EdgelessToolbarToolMixin } from '@labre/affine-widget-edgeless-toolbar';
import { SignalWatcher } from '@labre/global/lit';
import { css, html, LitElement } from 'lit';

import { PolygonTool } from '../polygon-tool.js';
import { ShapeTool } from '../shape-tool.js';
import type { DraggableShape } from './utils.js';

export class EdgelessShapeToolButton extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    edgeless-toolbar-button,
    .shapes {
      width: 100%;
      height: 64px;
    }
  `;

  private readonly _handleShapeClick = (shape: DraggableShape) => {
    if (shape.name === ShapeType.Polygon) {
      this.setEdgelessTool(PolygonTool);
    } else {
      this.setEdgelessTool(ShapeTool, {
        shapeName: shape.name,
      });
    }
    if (!this.popper) this._toggleMenu();
  };

  private readonly _handleWrapperClick = () => {
    if (this.tryDisposePopper()) return;

    this.setEdgelessTool(ShapeTool, {
      shapeName: ShapeType.Rect,
    });
    if (!this.popper) this._toggleMenu();
  };

  override type = [ShapeTool, PolygonTool];

  private _toggleMenu() {
    this.createPopper('edgeless-shape-menu', this, {
      setProps: ele => {
        ele.edgeless = this.edgeless;
        ele.onChange = (shapeName: ShapeName) => {
          if (shapeName === ShapeType.Polygon) {
            this.setEdgelessTool(PolygonTool);
          } else {
            this.setEdgelessTool(ShapeTool, {
              shapeName,
            });
            this._updateOverlay();
          }
        };
      },
    });
  }

  private _updateOverlay() {
    const controller = this.gfx.tool.currentTool$.peek();
    if (controller instanceof ShapeTool) {
      controller.createOverlay();
    }
  }

  override render() {
    const { active } = this;

    return html`
      <edgeless-toolbar-button
        class="edgeless-shape-button"
        .tooltip=${this.popper
          ? ''
          : html`<affine-tooltip-content-with-shortcut
              data-tip="${'Shape'}"
              data-shortcut="${'S'}"
            ></affine-tooltip-content-with-shortcut>`}
        .tooltipOffset=${5}
        .active=${active}
      >
        <edgeless-toolbar-shape-draggable
          .edgeless=${this.edgeless}
          .toolbarContainer=${this.toolbarContainer}
          class="shapes"
          @click=${this._handleWrapperClick}
          .onShapeClick=${this._handleShapeClick}
        >
        </edgeless-toolbar-shape-draggable>
      </edgeless-toolbar-button>
    `;
  }
}
