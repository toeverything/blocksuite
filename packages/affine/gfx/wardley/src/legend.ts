import { createGroupCommand } from '@blocksuite/affine-gfx-group';
import {
  ConnectorMode,
  FontFamily,
  PointStyle,
  ShapeStyle,
  StrokeStyle,
  type WardleyBackgroundElementModel,
} from '@blocksuite/affine-model';
import { Bound } from '@blocksuite/global/gfx';
import type { BlockStdScope } from '@blocksuite/std';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';

import { GRADIENT_GREEN, GRADIENT_RED } from './gradient';
import {
  INERTIA_COLOR,
  LINK_GREY,
  LINK_STROKE_WIDTH,
  MARKET_DOT_STROKE_WIDTH,
  MARKET_LINK_COLOR,
  MARKET_LINK_WIDTH,
  METHOD_FILL,
  NODE_FILL,
  NODE_STROKE,
  NODE_STROKE_WIDTH,
  PIPELINE_FILL,
  WARDLEY_RED,
} from './node/consts';

/** Component kinds the legend can describe, in display order. */
export type LegendType =
  | 'component'
  | 'anchor'
  | 'market'
  | 'ecosystem'
  | 'method'
  | 'pipeline'
  | 'link'
  | 'arrow'
  | 'inertia';

const LEGEND_ORDER: LegendType[] = [
  'component',
  'anchor',
  'market',
  'ecosystem',
  'method',
  'pipeline',
  'link',
  'arrow',
  'inertia',
];

/** Default (editable) French descriptions for each legend row. */
const LEGEND_DESC: Record<LegendType, string> = {
  component: 'Besoin / capacité (activité, pratique, donnée…)',
  anchor: 'Partie prenante (client, utilisateur…)',
  market: "Marché (ensemble d'acteurs)",
  ecosystem: 'Écosystème',
  method: 'Composant + méthode (couleur = phase)',
  pipeline: 'Pipeline (choix possibles pour une capacité)',
  link: 'Relation de besoin (parent → enfant)',
  arrow: 'Évolution / mouvement (rouge = futur)',
  inertia: 'Inertie au changement',
};

type GradientVariant = Exclude<WardleyBackgroundElementModel['variant'], 'classic'>;

/** Gradient-meaning block, keyed by variant (caption + 2-colour swatch). */
const LEGEND_GRADIENT: Record<
  GradientVariant,
  { caption: string; swatch: [string, string] }
> = {
  opportunity: {
    caption:
      "Gradient d'opportunité : valeur différentielle (vert) vs valeur opérationnelle (rouge).",
    swatch: [GRADIENT_GREEN, GRADIENT_RED],
  },
  benefit: {
    caption: 'Gradient : investissement (rouge) puis bénéfice (vert).',
    swatch: [GRADIENT_RED, GRADIENT_GREEN],
  },
  'evolution-gradient': {
    caption:
      "Gradient représentant la croissance de la fonction d'évolution de Wardley.",
    swatch: ['#9aa0a6', '#cfd2d6'],
  },
};

/**
 * Build a "Legend" group from real, editable elements (white rect frame +
 * "Legend" text + one row of [real component glyph + description text] per
 * Wardley component TYPE present inside the background's perimeter + a
 * gradient-meaning block when the background is a gradient variant). A snapshot
 * is created on each call; everything is grouped so it can be moved / resized /
 * edited and is dropped bottom-left of the background.
 */
export function createWardleyLegend(
  std: BlockStdScope,
  bg: WardleyBackgroundElementModel
) {
  const gfx = std.get(GfxControllerIdentifier);
  const surface = gfx.surface;
  if (!surface) return;

  const [bx, by, , bh] = bg.deserializedXYWH;

  // 1. Detect which component types are present inside the perimeter.
  const present = new Set<LegendType>();
  for (const el of gfx.getElementsByBound(Bound.deserialize(bg.xywh), {
    type: 'canvas',
  })) {
    if (el.type === 'wardleyNode') {
      const kind = (el as { kind?: string }).kind;
      if (kind && kind !== 'handle') present.add(kind as LegendType);
    } else if (el.type === 'connector') {
      const stroke = (el as { stroke?: unknown }).stroke;
      const dashed = (el as { strokeStyle?: string }).strokeStyle === StrokeStyle.Dash;
      if (dashed || stroke === WARDLEY_RED) present.add('arrow');
      else if (stroke === LINK_GREY) present.add('link');
      // market triangle connectors (NODE_STROKE) are ignored.
    } else if (el.type === 'shape') {
      if ((el as { fillColor?: unknown }).fillColor === INERTIA_COLOR) {
        present.add('inertia');
      }
    }
  }
  const rows = LEGEND_ORDER.filter(t => present.has(t));

  // 2. Layout (model units). The text column is wide enough for one-line
  // descriptions; the gradient row is taller as its caption may wrap.
  const PAD = 16;
  const TITLE_H = 28;
  const ROW_H = 30;
  const GLYPH_W = 46;
  const GAP = 12;
  const TEXT_FS = 15;
  const TITLE_FS = 18;
  const TEXT_W = 360;
  const GRAD_ROW_H = 40;
  const W = PAD * 2 + GLYPH_W + GAP + TEXT_W;

  const variant = bg.variant;
  const grad = variant !== 'classic' ? LEGEND_GRADIENT[variant] : null;
  const gradH = grad ? 12 + GRAD_ROW_H : 0;
  const H = PAD * 2 + TITLE_H + rows.length * ROW_H + gradH;

  const x0 = bx + 50;
  const y0 = by + bh - 56 - H;

  const text = (
    t: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    align: 'left' | 'center' = 'left'
  ) =>
    surface.addElement({
      type: 'text',
      text: t,
      fontFamily: FontFamily.Inter,
      fontSize,
      color: NODE_STROKE,
      textAlign: align,
      xywh: new Bound(x, y, w, h).serialize(),
    });

  // ── glyph builders (real, editable elements), centred on (cx, cy) ─────
  const ellipse = (
    kind: 'component' | 'anchor' | 'ecosystem' | 'method',
    d: number,
    fill: string,
    sw: number,
    cx: number,
    cy: number
  ) =>
    surface.addElement({
      type: 'wardleyNode',
      kind,
      shapeType: 'ellipse',
      filled: true,
      fillColor: fill,
      strokeColor: NODE_STROKE,
      strokeWidth: sw,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      xywh: new Bound(cx - d / 2, cy - d / 2, d, d).serialize(),
    });

  const glyph = (type: LegendType, cx: number, cy: number): string[] => {
    switch (type) {
      case 'component':
        return [ellipse('component', 16, NODE_FILL, NODE_STROKE_WIDTH, cx, cy)];
      case 'anchor':
        return [ellipse('anchor', 16, NODE_FILL, NODE_STROKE_WIDTH, cx, cy)];
      case 'ecosystem':
        return [ellipse('ecosystem', 20, NODE_FILL, NODE_STROKE_WIDTH, cx, cy)];
      case 'method':
        return [ellipse('method', 18, METHOD_FILL, NODE_STROKE_WIDTH, cx, cy)];
      case 'inertia':
        return [
          surface.addElement({
            type: 'shape',
            shapeType: 'rect',
            filled: true,
            fillColor: INERTIA_COLOR,
            strokeColor: INERTIA_COLOR,
            strokeWidth: 0,
            shapeStyle: ShapeStyle.General,
            roughness: 0,
            radius: 0,
            xywh: new Bound(cx - 2.5, cy - 11, 5, 22).serialize(),
          }),
        ];
      case 'pipeline': {
        const bw2 = 34;
        const bh2 = 12;
        const hd = 10;
        const top = cy - bh2 / 2;
        return [
          surface.addElement({
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
            xywh: new Bound(cx - bw2 / 2, top, bw2, bh2).serialize(),
          }),
          surface.addElement({
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
            xywh: new Bound(cx - hd / 2, top - hd / 2, hd, hd).serialize(),
          }),
        ];
      }
      case 'market': {
        const R = 11;
        const dr = 3;
        const rho = 6;
        const sin60 = Math.sqrt(3) / 2;
        const circle = surface.addElement({
          type: 'wardleyNode',
          kind: 'market',
          shapeType: 'ellipse',
          filled: true,
          fillColor: NODE_FILL,
          strokeColor: NODE_STROKE,
          strokeWidth: NODE_STROKE_WIDTH,
          shapeStyle: ShapeStyle.General,
          roughness: 0,
          xywh: new Bound(cx - R, cy - R, R * 2, R * 2).serialize(),
        });
        const verts = [
          [0, -rho],
          [rho * sin60, rho / 2],
          [-rho * sin60, rho / 2],
        ];
        const dots = verts.map(([vx, vy]) =>
          surface.addElement({
            type: 'wardleyNode',
            kind: 'component',
            shapeType: 'ellipse',
            filled: true,
            fillColor: NODE_FILL,
            strokeColor: NODE_STROKE,
            strokeWidth: MARKET_DOT_STROKE_WIDTH,
            shapeStyle: ShapeStyle.General,
            roughness: 0,
            xywh: new Bound(cx + vx - dr, cy + vy - dr, dr * 2, dr * 2).serialize(),
          })
        );
        const conns = [
          [dots[0], dots[1]],
          [dots[1], dots[2]],
          [dots[2], dots[0]],
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
        return [circle, ...dots, ...conns];
      }
      case 'link':
        return [
          surface.addElement({
            type: 'connector',
            mode: ConnectorMode.Straight,
            source: { position: [cx - 18, cy + 6] },
            target: { position: [cx + 18, cy - 6] },
            stroke: LINK_GREY,
            strokeStyle: StrokeStyle.Solid,
            strokeWidth: LINK_STROKE_WIDTH,
            frontEndpointStyle: PointStyle.None,
            rearEndpointStyle: PointStyle.None,
          }),
        ];
      case 'arrow':
        return [
          surface.addElement({
            type: 'connector',
            mode: ConnectorMode.Straight,
            source: { position: [cx - 18, cy] },
            target: { position: [cx + 16, cy] },
            stroke: WARDLEY_RED,
            strokeStyle: StrokeStyle.Dash,
            strokeWidth: LINK_STROKE_WIDTH,
            frontEndpointStyle: PointStyle.None,
            rearEndpointStyle: PointStyle.Triangle,
          }),
        ];
    }
  };

  // 3. Create the elements.
  std.store.captureSync();
  const ids: string[] = [];

  // White frame.
  ids.push(
    surface.addElement({
      type: 'shape',
      shapeType: 'rect',
      filled: true,
      fillColor: '#ffffff',
      strokeColor: '#cfd2d6',
      strokeWidth: 1,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      radius: 6,
      xywh: new Bound(x0, y0, W, H).serialize(),
    })
  );

  // Title.
  ids.push(
    text('Légende', x0 + PAD, y0 + PAD, W - PAD * 2, TITLE_FS + 6, TITLE_FS)
  );

  // Rows.
  let ry = y0 + PAD + TITLE_H;
  for (const t of rows) {
    const cyRow = ry + ROW_H / 2;
    ids.push(...glyph(t, x0 + PAD + GLYPH_W / 2, cyRow));
    ids.push(
      text(
        LEGEND_DESC[t],
        x0 + PAD + GLYPH_W + GAP,
        cyRow - (TEXT_FS + 8) / 2,
        TEXT_W,
        TEXT_FS + 8,
        TEXT_FS
      )
    );
    ry += ROW_H;
  }

  // Gradient meaning block: a separator, then [2-colour swatch | caption].
  if (grad) {
    const sepY = ry + 4;
    ids.push(
      surface.addElement({
        type: 'shape',
        shapeType: 'rect',
        filled: true,
        fillColor: '#cfd2d6',
        strokeColor: '#cfd2d6',
        strokeWidth: 0,
        shapeStyle: ShapeStyle.General,
        roughness: 0,
        radius: 0,
        xywh: new Bound(x0 + PAD, sepY, W - PAD * 2, 1).serialize(),
      })
    );
    const cyRow = sepY + 8 + GRAD_ROW_H / 2;
    const sw = 14;
    const sgap = 2;
    const sx = x0 + PAD + GLYPH_W / 2 - (sw * 2 + sgap) / 2;
    grad.swatch.forEach((col, i) => {
      ids.push(
        surface.addElement({
          type: 'shape',
          shapeType: 'rect',
          filled: true,
          fillColor: col,
          strokeColor: '#cfd2d6',
          strokeWidth: 0.5,
          shapeStyle: ShapeStyle.General,
          roughness: 0,
          radius: 1,
          xywh: new Bound(sx + i * (sw + sgap), cyRow - sw / 2, sw, sw).serialize(),
        })
      );
    });
    ids.push(
      text(
        grad.caption,
        x0 + PAD + GLYPH_W + GAP,
        cyRow - GRAD_ROW_H / 2,
        TEXT_W,
        GRAD_ROW_H,
        TEXT_FS
      )
    );
  }

  // 4. Group everything and select it.
  let selId = ids[0];
  const [, ctx] = std.command.exec(createGroupCommand, { elements: ids });
  const groupId = (ctx as { groupId?: string } | undefined)?.groupId;
  if (groupId) selId = groupId;
  gfx.selection.set({ elements: [selId], editing: false });
}
