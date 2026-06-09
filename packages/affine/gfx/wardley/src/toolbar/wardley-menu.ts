import { DefaultTool } from '@blocksuite/affine-block-surface';
import { ConnectorTool } from '@blocksuite/affine-gfx-connector';
import { createGroupCommand } from '@blocksuite/affine-gfx-group';
import { EmptyTool } from '@blocksuite/affine-gfx-pointer';
import {
  ConnectorMode,
  FontFamily,
  PointStyle,
  ShapeStyle,
  StrokeStyle,
} from '@blocksuite/affine-model';
import { EditPropsStore } from '@blocksuite/affine-shared/services';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import { css, html, LitElement } from 'lit';

import { REF_WIDTH } from '../consts';
import {
  HANDLE_SIZE,
  INERTIA_COLOR,
  INERTIA_SIZE,
  LABEL_DEFAULT,
  LABEL_FONT_SIZE,
  LABEL_GAP,
  LINK_GREY,
  LINK_STROKE_WIDTH,
  NODE_FILL,
  NODE_SIZE,
  NODE_STROKE,
  NODE_STROKE_WIDTH,
  PIPELINE_FILL,
  PIPELINE_HEIGHT,
  PIPELINE_LABEL,
  PIPELINE_WIDTH,
  WARDLEY_RED,
} from '../node/consts';
import {
  wardleyAnchorIcon,
  wardleyArrowIcon,
  wardleyBackgroundIcon,
  wardleyComponentIcon,
  wardleyInertiaIcon,
  wardleyLinkIcon,
  wardleyPipelineIcon,
} from './icons';

/**
 * The popover that opens above the toolbar for the Wardley toolbox. Each item
 * creates a pre-formatted Wardley object. Nodes (component / anchor) are a
 * native ellipse + a native text label, grouped together.
 */
export class EdgelessWardleyMenu extends EdgelessToolbarToolMixin(LitElement) {
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

  private _createBackground() {
    const { gfx } = this;
    if (!gfx.surface) return;

    let width = REF_WIDTH;
    for (const el of gfx.surface.getElementsByType('wardley')) {
      const [, , ew, eh] = el.deserializedXYWH;
      width = Math.max(width, ew, (eh * 16) / 9);
    }
    const height = (width * 9) / 16;

    const { centerX, centerY } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'wardley',
      xywh: new Bound(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height
      ).serialize(),
    });
    this._finish(id);
  }

  private _createNode(kind: 'component' | 'anchor') {
    const { gfx } = this;
    if (!gfx.surface) return;

    const { centerX: cx, centerY: cy } = gfx.viewport;
    const d = NODE_SIZE;

    // Native ellipse — inherits all shape behaviour (editable border, etc.).
    const nodeId = gfx.surface.addElement({
      type: 'wardleyNode',
      kind,
      shapeType: 'ellipse',
      filled: true,
      fillColor: NODE_FILL,
      strokeColor: NODE_STROKE,
      strokeWidth: NODE_STROKE_WIDTH,
      xywh: new Bound(cx - d / 2, cy - d / 2, d, d).serialize(),
    });

    // Native free-text label (same Inter family as the axis labels, size 18).
    const lh = LABEL_FONT_SIZE + 8;
    const labelId = gfx.surface.addElement({
      type: 'text',
      text: LABEL_DEFAULT[kind],
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign: 'left',
      xywh: new Bound(cx + d / 2 + LABEL_GAP, cy - lh / 2, 120, lh).serialize(),
    });

    // Group node + label so they move together (label follows the node; enter
    // the group to reposition / edit the label).
    let selId: string = nodeId;
    const [, ctx] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: [nodeId, labelId],
    });
    const groupId = (ctx as { groupId?: string } | undefined)?.groupId;
    if (groupId) selId = groupId;

    this._finish(selId);
  }

  private _createInertia() {
    const { gfx } = this;
    if (!gfx.surface) return;

    const { w, h } = INERTIA_SIZE;
    const { centerX, centerY } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'shape',
      shapeType: 'rect',
      filled: true,
      fillColor: INERTIA_COLOR,
      strokeColor: INERTIA_COLOR,
      strokeWidth: 0,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      radius: 0,
      xywh: new Bound(centerX - w / 2, centerY - h / 2, w, h).serialize(),
    });
    this._finish(id);
  }

  /**
   * Create a pipeline: a wide thin native rect body (white semi-transparent,
   * NON-connectable) + a node-sized square handle straddling its top edge (the
   * only connection point, center anchor) + a native text label. The handle and
   * label are grouped, then grouped again with the body so the whole pipeline
   * moves as one. Pure composition of native elements — no custom type / view.
   */
  private _createPipeline() {
    const { gfx } = this;
    if (!gfx.surface) return;

    const { centerX: cx, centerY: cy } = gfx.viewport;
    const W = PIPELINE_WIDTH;
    const H = PIPELINE_HEIGHT;
    const d = HANDLE_SIZE;
    const top = cy - H / 2;

    // Body: a WardleyNode rect, made non-connectable by `kind: 'pipeline'`.
    const bodyId = gfx.surface.addElement({
      type: 'wardleyNode',
      kind: 'pipeline',
      shapeType: 'rect',
      filled: true,
      fillColor: PIPELINE_FILL,
      strokeColor: NODE_STROKE,
      strokeWidth: NODE_STROKE_WIDTH,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      radius: 0,
      xywh: new Bound(cx - W / 2, top, W, H).serialize(),
    });

    // Handle: a node-sized WardleyNode square straddling the top edge. Inherits
    // `centerAnchorOnly` so connectors attach to its center only.
    const handleId = gfx.surface.addElement({
      type: 'wardleyNode',
      kind: 'handle',
      shapeType: 'rect',
      filled: true,
      fillColor: NODE_FILL,
      strokeColor: NODE_STROKE,
      strokeWidth: NODE_STROKE_WIDTH,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      radius: 0,
      xywh: new Bound(cx - d / 2, top - d / 2, d, d).serialize(),
    });

    // Native free-text label (same Inter family as the axis labels, size 18),
    // centered horizontally on the pipeline and sitting ABOVE the handle (not
    // astride the top edge).
    const lh = LABEL_FONT_SIZE + 8;
    const labelW = 120;
    const labelId = gfx.surface.addElement({
      type: 'text',
      text: PIPELINE_LABEL,
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign: 'center',
      xywh: new Bound(
        cx - labelW / 2,
        top - d / 2 - lh - LABEL_GAP,
        labelW,
        lh
      ).serialize(),
    });

    // Nested groups: (handle + label), then (body + that group).
    const [, c1] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: [handleId, labelId],
    });
    const innerId = (c1 as { groupId?: string } | undefined)?.groupId;
    const [, c2] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: innerId ? [bodyId, innerId] : [bodyId, handleId, labelId],
    });
    const outerId = (c2 as { groupId?: string } | undefined)?.groupId;

    this._finish(outerId ?? bodyId);
  }

  /**
   * Activate the native connector tool, pre-styled for a Wardley link (grey,
   * solid, no arrow) or evolution arrow (red, dashed, FILLED triangle). The
   * user then draws from one node to another (endpoints attach to centers).
   */
  private _activateConnector(kind: 'link' | 'arrow') {
    const props =
      kind === 'arrow'
        ? {
            mode: ConnectorMode.Straight,
            stroke: WARDLEY_RED,
            strokeStyle: StrokeStyle.Dash,
            strokeWidth: LINK_STROKE_WIDTH,
            frontEndpointStyle: PointStyle.None,
            rearEndpointStyle: PointStyle.Triangle,
          }
        : {
            mode: ConnectorMode.Straight,
            stroke: LINK_GREY,
            strokeStyle: StrokeStyle.Solid,
            strokeWidth: LINK_STROKE_WIDTH,
            frontEndpointStyle: PointStyle.None,
            rearEndpointStyle: PointStyle.None,
          };
    this.edgeless.std.get(EditPropsStore).recordLastProps('connector', props);
    this.gfx.tool.setTool(ConnectorTool, { mode: ConnectorMode.Straight });
    this.toolbar?.activePopper?.dispose();
  }

  private _finish(id: string) {
    const { gfx } = this;
    gfx.doc.captureSync();
    gfx.tool.setTool(DefaultTool);
    gfx.selection.set({ elements: [id], editing: false });
    this.toolbar?.activePopper?.dispose();
  }

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .tooltip=${'Fond de carte Wardley'}
              @click=${this._createBackground}
            >
              ${wardleyBackgroundIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Composant'}
              @click=${() => this._createNode('component')}
            >
              ${wardleyComponentIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Ancre'}
              @click=${() => this._createNode('anchor')}
            >
              ${wardleyAnchorIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Lien'}
              @click=${() => this._activateConnector('link')}
            >
              ${wardleyLinkIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Flèche (évolution)'}
              @click=${() => this._activateConnector('arrow')}
            >
              ${wardleyArrowIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Inertie'}
              @click=${this._createInertia}
            >
              ${wardleyInertiaIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Pipeline'}
              @click=${this._createPipeline}
            >
              ${wardleyPipelineIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
