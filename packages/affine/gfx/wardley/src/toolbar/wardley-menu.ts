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
  type WardleyBgVariant,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import type { GfxController } from '@blocksuite/std/gfx';
import { css, html, LitElement } from 'lit';

import { REF_WIDTH } from '../consts';
import {
  ECOSYSTEM_LABEL,
  ECOSYSTEM_SIZE,
  HANDLE_SIZE,
  INERTIA_COLOR,
  INERTIA_SIZE,
  LABEL_DEFAULT,
  LABEL_FONT_SIZE,
  LABEL_GAP,
  LINK_GREY,
  LINK_STROKE_WIDTH,
  MARKET_DOT_RING,
  MARKET_DOT_SIZE,
  MARKET_DOT_STROKE_WIDTH,
  MARKET_LABEL,
  MARKET_LINK_COLOR,
  MARKET_LINK_WIDTH,
  MARKET_SIZE,
  METHOD_FILL,
  METHOD_LABEL,
  METHOD_SIZE,
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
  wardleyBenefitIcon,
  wardleyComponentIcon,
  wardleyEcosystemIcon,
  wardleyInertiaIcon,
  wardleyLinkIcon,
  wardleyMarketIcon,
  wardleyMethodIcon,
  wardleyEvolutionGradientIcon,
  wardleyOpportunityIcon,
  wardleyPipelineIcon,
} from './icons';

/**
 * Per-variant default label overrides applied at creation (all remain editable
 * afterwards via the inline editor / toggles). The gradient itself is driven by
 * `variant` in the renderer.
 */
const BACKGROUND_VARIANT_DEFAULTS: Record<
  WardleyBgVariant,
  Record<string, unknown>
> = {
  classic: {},
  // The Y axis becomes "Opportunity"; phase labels keep the classic defaults.
  opportunity: {
    yAxisTitle: 'Opportunity',
    showVisibilityLabels: false,
    showCornerLabels: false,
  },
  // The Y axis splits into Benefit (top) / Investment (bottom) around a zero
  // line drawn by the renderer.
  benefit: {
    yAxisTitle: '',
    visibilityHigh: 'Benefit',
    visibilityLow: 'Investment',
    showCornerLabels: false,
  },
  // Keeps the classic labels (Value Chain / Uncharted / Industrialized…); only
  // the grey gradient differs.
  'evolution-gradient': {},
};

type Surface = NonNullable<GfxController['surface']>;

/** Height of the native free-text labels (Inter, size 18). */
const LABEL_H = LABEL_FONT_SIZE + 8;

/**
 * The single-circle node flavours: one connectable ellipse + a label to its
 * right, grouped. The glyph itself (anchor silhouette, ecosystem hatching,
 * method inner circle) is drawn by the node renderer from `kind`.
 */
const NODE_PRESETS = {
  component: { d: NODE_SIZE, fill: NODE_FILL, label: LABEL_DEFAULT.component },
  anchor: { d: NODE_SIZE, fill: NODE_FILL, label: LABEL_DEFAULT.anchor },
  // Ecosystem: glyph = double border + hatched donut; connectors attach to
  // this outer circle's center.
  ecosystem: { d: ECOSYSTEM_SIZE, fill: NODE_FILL, label: ECOSYSTEM_LABEL },
  // Method: the FILL color encodes the chosen method (editable).
  method: { d: METHOD_SIZE, fill: METHOD_FILL, label: METHOD_LABEL },
} as const;

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

  private _createBackground(variant: WardleyBgVariant = 'classic') {
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
      variant,
      ...BACKGROUND_VARIANT_DEFAULTS[variant],
      xywh: new Bound(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height
      ).serialize(),
    });
    this._track('FrameworkElementAdded', `background:${variant}`);
    this._finish(id);
  }

  /** Add a native ellipse wardley node centred on (cx, cy). */
  private _addEllipseNode(
    surface: Surface,
    kind: keyof typeof NODE_PRESETS | 'market',
    cx: number,
    cy: number,
    d: number,
    fillColor: string,
    strokeWidth = NODE_STROKE_WIDTH
  ) {
    return surface.addElement({
      type: 'wardleyNode',
      kind,
      shapeType: 'ellipse',
      filled: true,
      fillColor,
      strokeColor: NODE_STROKE,
      strokeWidth,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      xywh: new Bound(cx - d / 2, cy - d / 2, d, d).serialize(),
    });
  }

  /** Add a native free-text label (same Inter family as the axis labels). */
  private _addLabel(
    surface: Surface,
    text: string,
    x: number,
    y: number,
    textAlign: 'left' | 'center' = 'left'
  ) {
    return surface.addElement({
      type: 'text',
      text,
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign,
      xywh: new Bound(x, y, 120, LABEL_H).serialize(),
    });
  }

  /** Group elements; returns the group id (or the first id if grouping failed). */
  private _group(ids: string[]) {
    const [, result] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: ids,
    });
    return result.groupId || ids[0];
  }

  /**
   * Create a single-circle node (component / anchor / ecosystem / method):
   * one connectable native ellipse + a label to its right, grouped so they
   * move together (enter the group to reposition / edit the label).
   */
  private _createNode(kind: keyof typeof NODE_PRESETS) {
    const surface = this.gfx.surface;
    if (!surface) return;

    const { d, fill, label } = NODE_PRESETS[kind];
    const { centerX: cx, centerY: cy } = this.gfx.viewport;

    const nodeId = this._addEllipseNode(surface, kind, cx, cy, d, fill);
    const labelId = this._addLabel(
      surface,
      label,
      cx + d / 2 + LABEL_GAP,
      cy - LABEL_H / 2
    );

    this._track('FrameworkElementAdded', `node:${kind}`);
    this._finish(this._group([nodeId, labelId]));
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
    this._track('FrameworkElementAdded', 'node:inertia');
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

    // Label centered horizontally on the pipeline, sitting ABOVE the handle.
    const labelId = this._addLabel(
      gfx.surface,
      PIPELINE_LABEL,
      cx - 60,
      top - d / 2 - LABEL_H - LABEL_GAP,
      'center'
    );

    // Nested groups: (handle + label), then (body + that group).
    const innerId = this._group([handleId, labelId]);
    this._track('FrameworkElementAdded', 'node:pipeline');
    this._finish(this._group([bodyId, innerId]));
  }

  /**
   * Create a market: a large thin-bordered circle (the connectable market node)
   * containing 3 small thick-bordered component nodes wired into a triangle by
   * native attached connectors (thin, dark, no arrows — they auto-route between
   * the node centers and follow on move/resize). A label sits to the right and
   * everything is grouped into one object.
   */
  private _createMarket() {
    const surface = this.gfx.surface;
    if (!surface) return;

    const { centerX: cx, centerY: cy } = this.gfx.viewport;
    const R = MARKET_SIZE / 2;
    const rho = MARKET_DOT_RING;
    const sin60 = Math.sqrt(3) / 2;

    // Outer circle = the market node (connectable, center-only).
    const circleId = this._addEllipseNode(
      surface,
      'market',
      cx,
      cy,
      MARKET_SIZE,
      NODE_FILL
    );

    // 3 inner component nodes (thick border, no label) at the triangle vertices.
    const verts = [
      [0, -rho],
      [rho * sin60, rho / 2],
      [-rho * sin60, rho / 2],
    ];
    const dotIds = verts.map(([vx, vy]) =>
      this._addEllipseNode(
        surface,
        'component',
        cx + vx,
        cy + vy,
        MARKET_DOT_SIZE,
        NODE_FILL,
        MARKET_DOT_STROKE_WIDTH
      )
    );

    // Triangle: 3 attached connectors (auto-route center-to-center, clipped).
    const connIds = [
      [dotIds[0], dotIds[1]],
      [dotIds[1], dotIds[2]],
      [dotIds[2], dotIds[0]],
    ].map(([a, b]) =>
      surface.addElement({
        type: 'connector',
        mode: ConnectorMode.Straight,
        source: { id: a },
        target: { id: b },
        stroke: MARKET_LINK_COLOR,
        strokeStyle: StrokeStyle.Solid,
        strokeWidth: MARKET_LINK_WIDTH,
        frontEndpointStyle: PointStyle.None,
        rearEndpointStyle: PointStyle.None,
      })
    );

    const labelId = this._addLabel(
      surface,
      MARKET_LABEL,
      cx + R + LABEL_GAP,
      cy - LABEL_H / 2
    );

    this._track('FrameworkElementAdded', 'node:market');
    this._finish(this._group([circleId, ...dotIds, ...connIds, labelId]));
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
    this._track('FrameworkToolPicked', `connector:${kind}`);
    this.gfx.tool.setTool(ConnectorTool, { mode: ConnectorMode.Straight });
    // Keep the palette open (native sub-menu behaviour): it only closes on
    // re-click of the senior button, another senior tool, or Escape.
  }

  private _finish(id: string) {
    const { gfx } = this;
    gfx.doc.captureSync();
    gfx.tool.setTool(DefaultTool);
    gfx.selection.set({ elements: [id], editing: false });
    // Keep the palette open (native sub-menu behaviour) so several Wardley
    // objects can be added in a row; the canvas stays selectable meanwhile.
  }

  private _track(
    event: 'FrameworkElementAdded' | 'FrameworkToolPicked',
    element: string
  ) {
    this.edgeless.std.getOptional(TelemetryProvider)?.track(event, {
      framework: 'wardley',
      element,
      page: 'whiteboard editor',
      segment: 'wardley toolbox',
      module: 'wardley menu',
    });
  }

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .tooltip=${'Wardley map background'}
              @click=${() => this._createBackground('classic')}
            >
              ${wardleyBackgroundIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Opportunity background (gradient)'}
              @click=${() => this._createBackground('opportunity')}
            >
              ${wardleyOpportunityIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Benefit / Investment background (gradient)'}
              @click=${() => this._createBackground('benefit')}
            >
              ${wardleyBenefitIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Evolution background (Wardley presentation)'}
              @click=${() => this._createBackground('evolution-gradient')}
            >
              ${wardleyEvolutionGradientIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Component'}
              @click=${() => this._createNode('component')}
            >
              ${wardleyComponentIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Component + method'}
              @click=${() => this._createNode('method')}
            >
              ${wardleyMethodIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Market'}
              @click=${this._createMarket}
            >
              ${wardleyMarketIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Ecosystem'}
              @click=${() => this._createNode('ecosystem')}
            >
              ${wardleyEcosystemIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Anchor'}
              @click=${() => this._createNode('anchor')}
            >
              ${wardleyAnchorIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Pipeline'}
              @click=${this._createPipeline}
            >
              ${wardleyPipelineIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Link'}
              @click=${() => this._activateConnector('link')}
            >
              ${wardleyLinkIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Arrow (evolution)'}
              @click=${() => this._activateConnector('arrow')}
            >
              ${wardleyArrowIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Inertia'}
              @click=${this._createInertia}
            >
              ${wardleyInertiaIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
