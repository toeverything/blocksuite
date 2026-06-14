import {
  makeTemplateSnapshot,
  type SurfaceElementsJSON,
  surfaceText,
  type Template,
} from '@labre/affine-gfx-template';
import {
  ConnectorMode,
  FontFamily,
  PointStyle,
  ShapeStyle,
  StrokeStyle,
  TextAlign,
} from '@labre/affine-model';

import {
  INERTIA_COLOR,
  LABEL_FONT_SIZE,
  LINK_GREY,
  LINK_STROKE_WIDTH,
  NODE_FILL,
  NODE_SIZE,
  NODE_STROKE,
  WARDLEY_RED,
} from '../node/consts';

/**
 * Authoring kit for canonical Wardley maps. Positions are given as
 * (evolution 0..1, value 0..1) and mapped into the plot interior of a fixed
 * 1600x900 background. Per the composition principle, every glyph reuses an
 * existing shape: stakeholders/users are anchor (person) nodes, "needs" are
 * thick-stroked component nodes, capabilities are component nodes, notes are
 * native rects + text, inertia is the inertia bar, and the future / evolution
 * arrow is the red dashed connector. Legends are produced by the editor's
 * auto-legend action rather than baked into the template.
 */
const W = 1600;
const H = 900;
const PL = { x: 70, y: 56, w: 1470, h: 786 };
const ex = (e: number) => PL.x + e * PL.w;
const vy = (v: number) => PL.y + (1 - v) * PL.h;
const D = NODE_SIZE; // 18

const bg = (variant = 'classic') => ({ type: 'wardley', variant, xywh: `[0,0,${W},${H}]` });

function dot(e: number, v: number, sw: number, stroke = NODE_STROKE, fill = NODE_FILL) {
  const cx = ex(e);
  const cy = vy(v);
  return {
    type: 'wardleyNode',
    kind: 'component',
    shapeType: 'ellipse',
    filled: true,
    fillColor: fill,
    strokeColor: stroke,
    strokeWidth: sw,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    xywh: `[${cx - D / 2},${cy - D / 2},${D},${D}]`,
  };
}
const comp = (e: number, v: number) => dot(e, v, 1);
const future = (e: number, v: number) => dot(e, v, 2, WARDLEY_RED);
function stake(e: number, v: number) {
  const cx = ex(e);
  const cy = vy(v);
  const d = 24;
  return {
    type: 'wardleyNode',
    kind: 'anchor',
    shapeType: 'ellipse',
    filled: true,
    fillColor: NODE_FILL,
    strokeColor: NODE_STROKE,
    strokeWidth: 1,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    xywh: `[${cx - d / 2},${cy - d / 2},${d},${d}]`,
  };
}

type LblOpts = { dx?: number; dy?: number; align?: 'left' | 'right' | 'center'; color?: string; size?: number; w?: number };
function lbl(e: number, v: number, text: string, o: LblOpts = {}) {
  const cx = ex(e);
  const cy = vy(v);
  const w = o.w ?? 200;
  const dx = o.dx ?? 12;
  const dy = o.dy ?? -10;
  const align = o.align ?? 'left';
  const x = align === 'right' ? cx - w - dx : align === 'center' ? cx - w / 2 : cx + dx;
  return {
    type: 'text',
    text: surfaceText(text),
    color: o.color ?? NODE_STROKE,
    fontFamily: FontFamily.Inter,
    fontSize: o.size ?? LABEL_FONT_SIZE,
    textAlign: align === 'right' ? TextAlign.Right : align === 'center' ? TextAlign.Center : TextAlign.Left,
    xywh: `[${x},${cy + dy},${w},26]`,
  };
}

function link(a: string, b: string, o: { red?: boolean; arrow?: boolean } = {}) {
  return {
    type: 'connector',
    mode: ConnectorMode.Straight,
    stroke: o.red ? WARDLEY_RED : LINK_GREY,
    strokeStyle: o.arrow ? StrokeStyle.Dash : StrokeStyle.Solid,
    strokeWidth: LINK_STROKE_WIDTH,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: o.arrow ? PointStyle.Triangle : PointStyle.None,
    source: { id: a },
    target: { id: b },
  };
}

function inertia(e: number, v: number) {
  const cx = ex(e);
  const cy = vy(v);
  return {
    type: 'shape',
    shapeType: 'rect',
    filled: true,
    fillColor: INERTIA_COLOR,
    strokeColor: INERTIA_COLOR,
    strokeWidth: 0,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    radius: 0,
    xywh: `[${cx - 4},${cy - 22},8,44]`,
  };
}

function panel(x: number, y: number, w: number, h: number) {
  return {
    type: 'shape',
    shapeType: 'rect',
    filled: true,
    fillColor: '#ffffff',
    strokeColor: NODE_STROKE,
    strokeWidth: 1.2,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    radius: 0,
    xywh: `[${x},${y},${w},${h}]`,
  };
}
function freeText(x: number, y: number, w: number, str: string, size = 16, color = NODE_STROKE) {
  return {
    type: 'text',
    text: surfaceText(str),
    color,
    fontFamily: FontFamily.Inter,
    fontSize: size,
    textAlign: TextAlign.Left,
    xywh: `[${x},${y},${w},26]`,
  };
}
/** Centred, enlarged map title spanning the plot width. */
function title(str: string) {
  return {
    type: 'text',
    text: surfaceText(str),
    color: NODE_STROKE,
    fontFamily: FontFamily.Inter,
    fontSize: 28,
    textAlign: TextAlign.Center,
    xywh: `[${W / 2 - 500},12,1000,40]`,
  };
}

const ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';
const mapPreview = (extra: string) =>
  `<svg ${ATTRS} fill="none"><path d="M22 12 V64 H120" stroke="#3b3d42" stroke-width="2"/>${extra}</svg>`;

function tpl(name: string, preview: string, elements: SurfaceElementsJSON): Template {
  return { name, type: 'template', preview, content: makeTemplateSnapshot(elements, name) };
}

function ann(e: number, v: number) {
  const cx = ex(e);
  const cy = vy(v);
  return {
    type: 'shape',
    shapeType: 'ellipse',
    filled: true,
    fillColor: '#ffffff',
    strokeColor: NODE_STROKE,
    strokeWidth: 1.5,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    xywh: `[${cx - 14},${cy - 14},28,28]`,
  };
}
function annTxt(e: number, v: number, n: string) {
  const cx = ex(e);
  const cy = vy(v);
  return {
    type: 'text',
    text: surfaceText(n),
    color: NODE_STROKE,
    fontFamily: FontFamily.Inter,
    fontSize: 14,
    textAlign: TextAlign.Center,
    xywh: `[${cx - 14},${cy - 9},28,20]`,
  };
}

// ── Tea Shop (the canonical map) ──────────────────────────────────────
function teaShop(): SurfaceElementsJSON {
  return {
    bg: bg(),
    title: title('Tea Shop'),
    annBox: panel(120, 200, 420, 64),
    annText: freeText(132, 208, 400, 'Annotations:\n1. Standardising power lets kettles evolve faster\n2. Hot water is obvious and well known', 13),
    business: stake(0.62, 0.93),
    businessL: lbl(0.62, 0.93, 'Business', { align: 'center', dy: -28, w: 120 }),
    public: stake(0.78, 0.93),
    publicL: lbl(0.78, 0.93, 'Public', { align: 'center', dy: -28, w: 120 }),
    cupOfTea: comp(0.62, 0.74),
    cupOfTeaL: lbl(0.62, 0.74, 'Cup of Tea', { align: 'right' }),
    cup: comp(0.8, 0.7),
    cupL: lbl(0.8, 0.7, 'Cup'),
    tea: comp(0.83, 0.6),
    teaL: lbl(0.83, 0.6, 'Tea'),
    hotWater: comp(0.8, 0.47),
    hotWaterL: lbl(0.8, 0.47, 'Hot Water'),
    water: comp(0.81, 0.34),
    waterL: lbl(0.81, 0.34, 'Water'),
    kettle: comp(0.36, 0.38),
    kettleL: lbl(0.36, 0.38, 'Kettle', { align: 'right', dy: 6 }),
    electric: future(0.56, 0.38),
    electricL: lbl(0.56, 0.38, 'Electric Kettle'),
    power: comp(0.7, 0.1),
    powerL: lbl(0.7, 0.1, 'Power', { align: 'right', dy: 6 }),
    powerFut: future(0.88, 0.1),
    powerFutL: lbl(0.88, 0.1, 'Power'),
    limitedBy: lbl(0.56, 0.43, 'limited by', { align: 'center', w: 120, size: 13 }),
    ann1a: ann(0.5, 0.385), ann1t: annTxt(0.5, 0.385, '1'),
    ann2a: ann(0.84, 0.45), ann2t: annTxt(0.84, 0.45, '2'),
    l1: link('business', 'cupOfTea'),
    l2: link('public', 'cupOfTea'),
    l3: link('cupOfTea', 'cup'),
    l4: link('cupOfTea', 'tea'),
    l5: link('cupOfTea', 'hotWater'),
    l6: link('hotWater', 'water'),
    l7: link('hotWater', 'kettle'),
    l8: link('kettle', 'power'),
    a1: link('kettle', 'electric', { red: true, arrow: true }),
    a2: link('power', 'powerFut', { red: true, arrow: true }),
  };
}

// ── Kodak inertia (2005) ──────────────────────────────────────────────
function kodak(): SurfaceElementsJSON {
  return {
    bg: bg(),
    title: title("Wardley map of Kodak's 2005 inertia to digital"),
    user: stake(0.54, 0.92),
    userL: lbl(0.54, 0.92, 'User'),
    capture: dot(0.53, 0.8, 3),
    captureL: lbl(0.53, 0.8, 'Capture a moment'),
    film: comp(0.52, 0.62),
    filmL: lbl(0.52, 0.62, 'Film camera', { align: 'right' }),
    digital: future(0.74, 0.62),
    digitalL: lbl(0.74, 0.62, 'Digital camera', { color: WARDLEY_RED }),
    roll: comp(0.52, 0.4),
    rollL: lbl(0.52, 0.4, 'Photographic film', { align: 'right' }),
    storage: future(0.84, 0.4),
    storageL: lbl(0.84, 0.4, 'Digital storage', { color: WARDLEY_RED }),
    inertiaBar: inertia(0.78, 0.4),
    l1: link('user', 'capture'),
    l2: link('capture', 'film'),
    l3: link('film', 'roll'),
    r1: link('capture', 'storage', { red: true }),
    a1: link('film', 'digital', { red: true, arrow: true }),
    a2: link('roll', 'storage', { red: true, arrow: true }),
  };
}

export const wardleyMaps: Template[] = [
  tpl('Tea Shop', mapPreview('<circle cx="78" cy="24" r="3" fill="#fff" stroke="#1f2328"/><circle cx="50" cy="44" r="3" fill="#fff" stroke="#1f2328"/><circle cx="86" cy="40" r="3" fill="#fff" stroke="#1f2328"/><circle cx="92" cy="58" r="3" fill="#fff" stroke="#1f2328"/><path d="M78 24 L50 44 M78 24 L86 40 L92 58" stroke="#666"/><path d="M50 44 h22" stroke="#d6455d" stroke-dasharray="3 2"/>'), teaShop()),
  tpl('Kodak inertia', mapPreview('<circle cx="56" cy="22" r="3" fill="#fff" stroke="#1f2328"/><circle cx="54" cy="40" r="3" fill="#fff" stroke="#1f2328"/><circle cx="86" cy="40" r="3" fill="#fff" stroke="#d6455d"/><rect x="76" y="35" width="2.5" height="11" fill="#1f2328"/><path d="M57 40 h17" stroke="#d6455d" stroke-dasharray="3 2"/>'), kodak()),
];
