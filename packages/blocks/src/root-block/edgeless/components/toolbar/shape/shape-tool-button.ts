import { ShapeType, type ShapeName } from '@blocksuite/affine-model';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { DraggableShape } from './utils.js';

import { ShapeToolController } from '../../../tools/shape-tool.js';
import '../../buttons/toolbar-button.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import './shape-draggable.js';
import './shape-menu.js';

@customElement('edgeless-shape-tool-button')
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

  override type = 'shape' as const;

  private _handleShapeClick = (shape: DraggableShape) => {
    this.setEdgelessTool({
      type: this.type,
      shapeName: shape.name,
    });
    if (!this.popper) this._toggleMenu();
  };

  private _handleWrapperClick = () => {
    if (this.tryDisposePopper()) return;

    this.setEdgelessTool({
      type: this.type,
      shapeName: ShapeType.Rect,
    });
    if (!this.popper) this._toggleMenu();
  };

  private _toggleMenu() {
    this.createPopper('edgeless-shape-menu', this, {
      setProps: ele => {
        ele.edgeless = this.edgeless;
        ele.onChange = (shapeName: ShapeName) => {
          this.setEdgelessTool({
            type: this.type,
            shapeName,
          });
          this._updateOverlay();
        };
      },
    });
  }

  private _updateOverlay() {
    const controller = this.edgeless.tools.currentController;
    if (controller instanceof ShapeToolController) {
      controller.createOverlay();
    }
  }

  override render() {
    const { active } = this;

    return html`
      <edgeless-toolbar-button
        class="edgeless-shape-button"
        .tooltip=${this.popper ? '' : getTooltipWithShortcut('Shape', 'S')}
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

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
