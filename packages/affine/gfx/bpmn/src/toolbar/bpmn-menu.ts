import { DefaultTool } from '@labre/affine-block-surface';
import { ConnectorTool } from '@labre/affine-gfx-connector';
import { EmptyTool } from '@labre/affine-gfx-pointer';
import {
  ConnectorMode,
  FontFamily,
  PointStyle,
  ShapeStyle,
  StrokeStyle,
} from '@labre/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@labre/affine-shared/services';
import { EdgelessToolbarToolMixin } from '@labre/affine-widget-edgeless-toolbar';
import { Bound } from '@labre/global/gfx';
import { css, html, LitElement } from 'lit';

import {
  EVENT_END,
  EVENT_START,
  END_WIDTH,
  INNER_FONT_SIZE,
  NEUTRAL_STROKE,
  NODE_FILL,
  NODE_LABEL,
  NODE_SIZE,
  NODE_STROKE_WIDTH,
  SEQUENCE_STROKE,
  SEQUENCE_WIDTH,
  START_WIDTH,
  TASK_RADIUS,
} from '../consts';
import {
  bpmnEndIcon,
  bpmnGatewayIcon,
  bpmnPoolIcon,
  bpmnSequenceIcon,
  bpmnStartIcon,
  bpmnTaskIcon,
} from './icons';

type NodeKind = 'startEvent' | 'endEvent' | 'task' | 'gatewayExclusive';

/** Per-kind native shape + accent presets (style C). */
const NODE_PRESETS: Record<
  NodeKind,
  { shapeType: 'ellipse' | 'rect' | 'diamond'; stroke: string; width: number }
> = {
  startEvent: { shapeType: 'ellipse', stroke: EVENT_START, width: START_WIDTH },
  endEvent: { shapeType: 'ellipse', stroke: EVENT_END, width: END_WIDTH },
  task: { shapeType: 'rect', stroke: NEUTRAL_STROKE, width: NODE_STROKE_WIDTH },
  gatewayExclusive: {
    shapeType: 'diamond',
    stroke: NEUTRAL_STROKE,
    width: NODE_STROKE_WIDTH,
  },
};

/**
 * The popover above the toolbar for the BPMN toolbox. Items create the flow
 * objects (native shapes, so they stay editable), the pool background, and arm
 * the native connector tool for sequence flows. Mirrors the EDGY menu.
 */
export class EdgelessBpmnMenu extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .button-group-container {
      display: flex;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
    .button-group-container svg {
      width: 24px;
      height: 24px;
    }
  `;

  override type = EmptyTool;

  /** Create a flow-object node (native shape) centred on the viewport. */
  private _createNode(kind: NodeKind) {
    const surface = this.gfx.surface;
    if (!surface) return;

    const { w, h } = NODE_SIZE[kind];
    const { centerX: cx, centerY: cy } = this.gfx.viewport;
    const preset = NODE_PRESETS[kind];

    const id = surface.addElement({
      type: 'bpmnNode',
      kind,
      shapeType: preset.shapeType,
      filled: true,
      fillColor: NODE_FILL,
      strokeColor: preset.stroke,
      strokeWidth: preset.width,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      radius: kind === 'task' ? TASK_RADIUS : 0,
      text: NODE_LABEL[kind] || undefined,
      color: NEUTRAL_STROKE,
      fontFamily: FontFamily.Inter,
      fontSize: INNER_FONT_SIZE,
      textAlign: 'center',
      xywh: new Bound(cx - w / 2, cy - h / 2, w, h).serialize(),
    });
    this._track('FrameworkElementAdded', `node:${kind}`);
    this._finish(id);
  }

  /** Create a pool (background container) centred on the viewport. */
  private _createPool() {
    const surface = this.gfx.surface;
    if (!surface) return;

    const w = 560;
    const h = 200;
    const { centerX: cx, centerY: cy } = this.gfx.viewport;
    const id = surface.addElement({
      type: 'bpmnPool',
      xywh: new Bound(cx - w / 2, cy - h / 2, w, h).serialize(),
    });
    this._track('FrameworkElementAdded', 'pool');
    this._finish(id);
  }

  /**
   * Arm the native connector tool, pre-styled for a BPMN sequence flow:
   * orthogonal, solid, with a filled triangle head. The user then draws from
   * one node to another (endpoints attach to centers).
   */
  private _activateSequenceFlow() {
    this.edgeless.std.get(EditPropsStore).recordLastProps('connector', {
      mode: ConnectorMode.Orthogonal,
      stroke: SEQUENCE_STROKE,
      strokeStyle: StrokeStyle.Solid,
      strokeWidth: SEQUENCE_WIDTH,
      frontEndpointStyle: PointStyle.None,
      rearEndpointStyle: PointStyle.Triangle,
    });
    this._track('FrameworkToolPicked', 'connector:sequence');
    this.gfx.tool.setTool(ConnectorTool, { mode: ConnectorMode.Orthogonal });
    // Keep the palette open (native sub-menu behaviour).
  }

  private _finish(id: string) {
    const { gfx } = this;
    gfx.doc.captureSync();
    gfx.tool.setTool(DefaultTool);
    gfx.selection.set({ elements: [id], editing: false });
    // Keep the palette open (native sub-menu behaviour).
  }

  private _track(
    event: 'FrameworkElementAdded' | 'FrameworkToolPicked',
    element: string
  ) {
    this.edgeless.std.getOptional(TelemetryProvider)?.track(event, {
      framework: 'bpmn',
      element,
      page: 'whiteboard editor',
      segment: 'bpmn toolbox',
      module: 'bpmn menu',
    });
  }

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .tooltip=${'Start event'}
              @click=${() => this._createNode('startEvent')}
            >
              ${bpmnStartIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'End event'}
              @click=${() => this._createNode('endEvent')}
            >
              ${bpmnEndIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Task'}
              @click=${() => this._createNode('task')}
            >
              ${bpmnTaskIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Exclusive gateway'}
              @click=${() => this._createNode('gatewayExclusive')}
            >
              ${bpmnGatewayIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Sequence flow'}
              @click=${this._activateSequenceFlow}
            >
              ${bpmnSequenceIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Pool'}
              @click=${this._createPool}
            >
              ${bpmnPoolIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
