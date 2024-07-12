import { cssVar } from '@toeverything/theme';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { LastProps } from '../../../../../surface-block/managers/edit-session.js';
import type { ShapeName } from './shape-tool-element.js';
import type { DraggableShape } from './utils.js';

import { isTransparent } from '../../../../../_common/theme/css-variables.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  ShapeType,
} from '../../../../../surface-block/elements/shape/consts.js';
import { ShapeStyle } from '../../../../../surface-block/index.js';
import { ShapeToolController } from '../../../controllers/tools/shape-tool.js';
import '../../buttons/toolbar-button.js';
import { getTooltipWithShortcut } from '../../utils.js';
import {
  applyLastProps,
  observeLastProps,
} from '../common/observe-last-props.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import './shape-draggable.js';
import './shape-menu.js';
import { ShapeComponentConfig } from './shape-menu-config.js';

const { Rect } = ShapeType;

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends EdgelessToolbarToolMixin(
  LitElement
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

  private _handleShapeClick(shape: DraggableShape) {
    const name = shape.name;
    if (name !== this.states.shapeType) {
      const shapeConfig = ShapeComponentConfig.find(s => s.name === name);
      if (!shapeConfig) return;
      this.edgeless.service.editPropsStore.recordLastProps(
        'shape',
        shapeConfig?.value
      );
      this.updateMenu();
    }
    if (!this.popper) this._toggleMenu();
  }

  private _toggleMenu() {
    if (this.tryDisposePopper()) return;
    this.setEdgelessTool({
      shapeType: this.states.shapeType!,
      type: this.type,
    });
    const menu = this.createPopper('edgeless-shape-menu', this);
    Object.assign(menu.element, {
      edgeless: this.edgeless,
      onChange: (props: Record<string, unknown>) => {
        this.edgeless.service.editPropsStore.recordLastProps('shape', props);
        this.updateMenu();
        this._updateOverlay();

        this.setEdgelessTool({
          shapeType: (props.shapeType as ShapeName) ?? this.states.shapeType,
          type: 'shape',
        });
      },
    });
    this.updateMenu();
  }

  private _updateOverlay() {
    const controller = this.edgeless.tools.currentController;
    if (controller instanceof ShapeToolController) {
      controller.createOverlay();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const { edgeless, stateKeys, states, type } = this;
    applyLastProps(edgeless.service, type, stateKeys, states);

    this.disposables.add(
      observeLastProps(
        edgeless.service,
        'shape',
        stateKeys,
        states,
        updates => {
          this.states = { ...this.states, ...updates };
        }
      )
    );
  }

  override render() {
    const { active, states } = this;
    const { fillColor, strokeColor } = states;

    const shapeColor = isTransparent(fillColor!)
      ? cssVar('white60')
      : `var(${fillColor})`;
    const shapeStroke = isTransparent(strokeColor!)
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

  updateMenu() {
    if (!this.popper) return;
    Object.assign(this.popper.element, this.states);
  }

  get stateKeys() {
    return Object.keys(this.states) as Array<keyof typeof this.states>;
  }

  @state()
  accessor states: Partial<LastProps['shape']> = {
    fillColor: DEFAULT_SHAPE_FILL_COLOR,
    radius: 0,
    shapeStyle: ShapeStyle.Scribbled,
    shapeType: Rect,
    strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
