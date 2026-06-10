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

/** Background flavours creatable from the menu. */
type BgVariant = 'classic' | 'opportunity' | 'benefit' | 'evolution-gradient';

/**
 * Per-variant default label overrides applied at creation (all remain editable
 * afterwards via the Slice-B inline editor / toggles). The gradient itself is
 * driven by `variant` in the renderer.
 */
const BACKGROUND_VARIANT_DEFAULTS: Record<BgVariant, Record<string, unknown>> = {
  classic: {},
  opportunity: {
    xAxisTitle: 'Évolution',
    yAxisTitle: 'Opportunity',
    phase0: 'Genèse',
    phase1: 'Sur mesure',
    phase2: 'Produit (+ location)',
    phase3: 'Commodité (+ utilitaire)',
    showVisibilityLabels: false,
    showCornerLabels: false,
  },
  benefit: {
    xAxisTitle: 'Évolution',
    yAxisTitle: '',
    visibilityHigh: 'Benefit',
    visibilityLow: 'Investment',
    phase0: 'Genèse',
    phase1: 'Sur mesure',
    phase2: 'Produit (+ location)',
    phase3: 'Commodité (+ utilitaire)',
    showCornerLabels: false,
  },
  // Keeps the classic labels (Value Chain / Uncharted / Industrialized…); only
  // the grey gradient differs.
  'evolution-gradient': {},
};

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

  private _createBackground(variant: BgVariant = 'classic') {
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
   * Create a market: a large thin-bordered circle (the connectable market node)
   * containing 3 small thick-bordered component nodes wired into a triangle by
   * native attached connectors (thin, dark, no arrows — they auto-route between
   * the node centers and follow on move/resize). A label sits to the right and
   * everything is grouped into one object.
   */
  private _createMarket() {
    const { gfx } = this;
    if (!gfx.surface) return;

    const { centerX: cx, centerY: cy } = gfx.viewport;
    const R = MARKET_SIZE / 2;
    const dr = MARKET_DOT_SIZE / 2;
    const rho = MARKET_DOT_RING;
    const sin60 = Math.sqrt(3) / 2;

    // Outer circle = the market node (connectable, center-only).
    const circleId = gfx.surface.addElement({
      type: 'wardleyNode',
      kind: 'market',
      shapeType: 'ellipse',
      filled: true,
      fillColor: NODE_FILL,
      strokeColor: NODE_STROKE,
      strokeWidth: NODE_STROKE_WIDTH,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      xywh: new Bound(cx - R, cy - R, MARKET_SIZE, MARKET_SIZE).serialize(),
    });

    // 3 inner component nodes (thick border, no label) at the triangle vertices.
    const verts = [
      [0, -rho],
      [rho * sin60, rho / 2],
      [-rho * sin60, rho / 2],
    ];
    const dotIds = verts.map(([vx, vy]) =>
      gfx.surface!.addElement({
        type: 'wardleyNode',
        kind: 'component',
        shapeType: 'ellipse',
        filled: true,
        fillColor: NODE_FILL,
        strokeColor: NODE_STROKE,
        strokeWidth: MARKET_DOT_STROKE_WIDTH,
        shapeStyle: ShapeStyle.General,
        roughness: 0,
        xywh: new Bound(
          cx + vx - dr,
          cy + vy - dr,
          MARKET_DOT_SIZE,
          MARKET_DOT_SIZE
        ).serialize(),
      })
    );

    // Triangle: 3 attached connectors (auto-route center-to-center, clipped).
    const connIds = [
      [dotIds[0], dotIds[1]],
      [dotIds[1], dotIds[2]],
      [dotIds[2], dotIds[0]],
    ].map(([a, b]) =>
      gfx.surface!.addElement({
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

    // Native label to the right of the circle.
    const lh = LABEL_FONT_SIZE + 8;
    const labelId = gfx.surface.addElement({
      type: 'text',
      text: MARKET_LABEL,
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign: 'left',
      xywh: new Bound(cx + R + LABEL_GAP, cy - lh / 2, 120, lh).serialize(),
    });

    let selId: string = circleId;
    const [, ctx] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: [circleId, ...dotIds, ...connIds, labelId],
    });
    const groupId = (ctx as { groupId?: string } | undefined)?.groupId;
    if (groupId) selId = groupId;

    this._finish(selId);
  }

  /**
   * Create an ecosystem: a single connectable circle rendered as a glyph (double
   * border + hatched inner donut + hollow center, drawn by the node renderer).
   * The connection therefore attaches to this outer circle's center. Label to the
   * right; grouped with it.
   */
  private _createEcosystem() {
    const { gfx } = this;
    if (!gfx.surface) return;

    const { centerX: cx, centerY: cy } = gfx.viewport;
    const r = ECOSYSTEM_SIZE / 2;

    const nodeId = gfx.surface.addElement({
      type: 'wardleyNode',
      kind: 'ecosystem',
      shapeType: 'ellipse',
      filled: true,
      fillColor: NODE_FILL,
      strokeColor: NODE_STROKE,
      strokeWidth: NODE_STROKE_WIDTH,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      xywh: new Bound(cx - r, cy - r, ECOSYSTEM_SIZE, ECOSYSTEM_SIZE).serialize(),
    });

    const lh = LABEL_FONT_SIZE + 8;
    const labelId = gfx.surface.addElement({
      type: 'text',
      text: ECOSYSTEM_LABEL,
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign: 'left',
      xywh: new Bound(cx + r + LABEL_GAP, cy - lh / 2, 120, lh).serialize(),
    });

    let selId: string = nodeId;
    const [, ctx] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: [nodeId, labelId],
    });
    const groupId = (ctx as { groupId?: string } | undefined)?.groupId;
    if (groupId) selId = groupId;

    this._finish(selId);
  }

  /**
   * Create a "component + method": a single connectable circle whose FILL color
   * encodes the chosen method (editable), with a white component inscribed at its
   * center (drawn by the node renderer). Label to the right; grouped.
   */
  private _createMethod() {
    const { gfx } = this;
    if (!gfx.surface) return;

    const { centerX: cx, centerY: cy } = gfx.viewport;
    const r = METHOD_SIZE / 2;

    const nodeId = gfx.surface.addElement({
      type: 'wardleyNode',
      kind: 'method',
      shapeType: 'ellipse',
      filled: true,
      fillColor: METHOD_FILL,
      strokeColor: NODE_STROKE,
      strokeWidth: NODE_STROKE_WIDTH,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      xywh: new Bound(cx - r, cy - r, METHOD_SIZE, METHOD_SIZE).serialize(),
    });

    const lh = LABEL_FONT_SIZE + 8;
    const labelId = gfx.surface.addElement({
      type: 'text',
      text: METHOD_LABEL,
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign: 'left',
      xywh: new Bound(cx + r + LABEL_GAP, cy - lh / 2, 120, lh).serialize(),
    });

    let selId: string = nodeId;
    const [, ctx] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: [nodeId, labelId],
    });
    const groupId = (ctx as { groupId?: string } | undefined)?.groupId;
    if (groupId) selId = groupId;

    this._finish(selId);
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

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .tooltip=${'Fond de carte Wardley'}
              @click=${() => this._createBackground('classic')}
            >
              ${wardleyBackgroundIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Fond Opportunité (gradient)'}
              @click=${() => this._createBackground('opportunity')}
            >
              ${wardleyOpportunityIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Fond Bénéfice / Investissement (gradient)'}
              @click=${() => this._createBackground('benefit')}
            >
              ${wardleyBenefitIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Fond Évolution (présentation Wardley)'}
              @click=${() => this._createBackground('evolution-gradient')}
            >
              ${wardleyEvolutionGradientIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Composant'}
              @click=${() => this._createNode('component')}
            >
              ${wardleyComponentIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Composant + méthode'}
              @click=${this._createMethod}
            >
              ${wardleyMethodIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Marché'}
              @click=${this._createMarket}
            >
              ${wardleyMarketIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Écosystème'}
              @click=${this._createEcosystem}
            >
              ${wardleyEcosystemIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Ancre'}
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
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
