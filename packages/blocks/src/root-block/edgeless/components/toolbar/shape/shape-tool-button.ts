import '../../buttons/toolbar-button.js';
import './shape-menu.js';
import './shape-draggable.js';

import { noop } from '@blocksuite/global/utils';
import { cssVar } from '@toeverything/theme';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isTransparent } from '../../../../../_common/theme/css-variables.js';
import type { ShapeTool } from '../../../../../_common/types.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  ShapeType,
} from '../../../../../surface-block/elements/shape/consts.js';
import { ShapeStyle } from '../../../../../surface-block/index.js';
import { ShapeToolController } from '../../../controllers/tools/shape-tool.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { ToolbarButtonWithMenuMixin } from '../mixins/toolbar-button-with-menu.mixin.js';
import type { EdgelessShapeMenu } from './shape-menu.js';
import { ShapeComponentConfig } from './shape-menu-config.js';
import type { ShapeName } from './shape-tool-element.js';
import type { DraggableShape } from './utils.js';

const { Rect } = ShapeType;

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends ToolbarButtonWithMenuMixin<
  EdgelessShapeMenu,
  'shape',
  readonly ['shapeStyle', 'shapeType', 'fillColor', 'strokeColor', 'radius']
>(LitElement) {
  override type = 'shape' as const;

  override _type = 'shape' as const;

  override enableActiveBackground = true;

  static styles = css`
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

  @state()
  accessor shapeStyle: ShapeStyle = ShapeStyle.Scribbled;

  @state()
  accessor shapeType: ShapeName = Rect;

  @state()
  accessor fillColor: string = DEFAULT_SHAPE_FILL_COLOR;

  @state()
  accessor strokeColor: string = DEFAULT_SHAPE_STROKE_COLOR;

  @state()
  accessor radius = 0;

  protected override _states = [
    'shapeStyle',
    'shapeType',
    'fillColor',
    'strokeColor',
    'radius',
  ] as const;

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;
    this.setEdgelessTool({
      type: this._type,
      shapeType: this.shapeType,
    });
    const menu = this.createPopper('edgeless-shape-menu', this, {
      onDispose: () => (this._menu = null),
    });
    this._menu = menu;
    Object.assign(menu.element, {
      edgeless: this.edgeless,
      onChange: (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.record(this._type, props);
        this.updateMenu();
        this._updateOverlay();
      },
    });
    this.updateMenu();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      this.edgeless.service.editPropsStore.slots.lastPropsUpdated.on(
        ({ type, props }) => {
          if (type !== 'shape') return;
          if (props.shapeType) {
            this.setEdgelessTool({
              type: 'shape',
              shapeType: props.shapeType as ShapeTool['shapeType'],
            });
          }
          Object.assign(
            this,
            this._states
              .filter(key => props[key] != undefined)
              .reduce((acc, key) => ({ ...acc, [key]: props[key] }), {})
          );
        }
      )
    );
  }

  // duplicated with connectedCallback, so override it
  override initLastPropsSlot() {
    noop();
  }

  private _updateOverlay() {
    const controller = this.edgeless.tools.currentController;
    if (controller instanceof ShapeToolController) {
      controller.createOverlay();
    }
  }

  private _handleShapeClick(shape: DraggableShape) {
    if (!this.popper) {
      this._toggleMenu();
    }
    const name = shape.name;
    if (name !== this.shapeType) {
      const shapeConfig = ShapeComponentConfig.find(s => s.name === name);
      if (!shapeConfig) return;
      this.edgeless.service.editPropsStore.record('shape', shapeConfig?.value);
      this.updateMenu();
    }
  }

  override render() {
    const { active, fillColor, strokeColor } = this;

    const shapeColor = isTransparent(fillColor)
      ? cssVar('white60')
      : `var(${fillColor})`;
    const shapeStroke = isTransparent(strokeColor)
      ? cssVar('black10')
      : `var(${strokeColor})`;

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
          style=${styleMap({
            color: shapeColor,
            stroke: shapeStroke,
          })}
          .color=${shapeColor}
          .stroke=${shapeStroke}
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
