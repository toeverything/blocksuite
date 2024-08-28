import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { SignalWatcher, computed } from '@lit-labs/preact-signals';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ShapeName } from './shape-tool-element.js';
import type { DraggableShape } from './utils.js';

import { ShapeToolController } from '../../../controllers/tools/shape-tool.js';
import '../../buttons/toolbar-button.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import './shape-draggable.js';
import './shape-menu.js';
import { ShapeComponentConfig } from './shape-menu-config.js';

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  private _props$ = computed(() => {
    const { shapeStyle, shapeType, fillColor, strokeColor, radius } =
      this.edgeless.service.editPropsStore.lastProps$.value.shape;
    return {
      shapeStyle,
      shapeType,
      fillColor,
      strokeColor,
      radius,
    };
  });

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

  private _handleShapeClick(shape: DraggableShape) {
    const name = shape.name;
    const { shapeType } = this._props$.value;
    if (name !== shapeType) {
      const shapeConfig = ShapeComponentConfig.find(s => s.name === name);
      if (!shapeConfig) return;
      this.edgeless.service.editPropsStore.recordLastProps(
        'shape',
        shapeConfig?.value
      );
    }
    if (!this.popper) this._toggleMenu();
  }

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;

    const { shapeType } = this._props$.value;
    this.setEdgelessTool({
      type: this.type,
      shapeType,
    });
    const menu = this.createPopper('edgeless-shape-menu', this);
    Object.assign(menu.element, {
      edgeless: this.edgeless,
      onChange: (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.recordLastProps('shape', props);
        this._updateOverlay();

        this.setEdgelessTool({
          type: 'shape',
          shapeType: (props.shapeType as ShapeName) ?? shapeType,
        });
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
    const { fillColor, strokeColor } = this._props$.value;

    const color = ThemeObserver.generateColorProperty(fillColor!);
    const stroke = ThemeObserver.generateColorProperty(strokeColor!);

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
          style=${styleMap({ color, stroke })}
          .color=${color}
          .stroke=${stroke}
          @click=${this._toggleMenu}
          .onShapeClick=${this._handleShapeClick.bind(this)}
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
