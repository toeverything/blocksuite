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
 * thick-stroked component nodes, capabilities are component nodes, pipelines /
 * notes / legends are native rects + text, inertia is the inertia bar, and the
 * future / evolution arrow is the red dashed connector.
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
const need = (e: number, v: number) => dot(e, v, 3);
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

/** Pipeline box: a thin rectangle spanning an evolution range at a value. */
function pipeBox(e1: number, e2: number, v: number, h = 44) {
  const x = ex(e1);
  const w = ex(e2) - x;
  return {
    type: 'shape',
    shapeType: 'rect',
    filled: false,
    fillColor: '#ffffff',
    strokeColor: NODE_STROKE,
    strokeWidth: 1.2,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    radius: 0,
    xywh: `[${x},${vy(v) - h / 2},${w},${h}]`,
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

const ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';
const mapPreview = (extra: string) =>
  `<svg ${ATTRS} fill="none"><path d="M22 12 V64 H120" stroke="#3b3d42" stroke-width="2"/>${extra}</svg>`;

function tpl(name: string, preview: string, elements: SurfaceElementsJSON): Template {
  return { name, type: 'template', preview, content: makeTemplateSnapshot(elements, name) };
}

// ── Tea Shop (the canonical map) ──────────────────────────────────────
function teaShop(): SurfaceElementsJSON {
  return {
    bg: bg(),
    title: freeText(40, 24, 300, 'Tea Shop', 22),
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

// ── Kodak inertia (2005) ──────────────────────────────────────────────
function kodak(): SurfaceElementsJSON {
  return {
    bg: bg(),
    title: freeText(360, 24, 760, "Wardley map of Kodak's 2005 inertia to digital", 16),
    legend: panel(120, 120, 360, 220),
    legendT: freeText(132, 128, 340, 'Legend\n⊗ Stakeholder\n○ Need\n○ Capability\n○ Future capability (red)\n○- > Change in progress\n█ Inertia to phase change', 13),
    user: stake(0.54, 0.92),
    userL: lbl(0.54, 0.92, 'User'),
    capture: need(0.53, 0.8),
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

// ── Pipeline usage (taxi market space) ────────────────────────────────
function taxiPipelines(): SurfaceElementsJSON {
  const out: SurfaceElementsJSON = {
    bg: bg(),
    title: freeText(360, 24, 760, 'Mapping a taxi firm market space to anticipate the future of the activity', 15),
    usager: stake(0.66, 0.95),
    usagerL: lbl(0.66, 0.95, 'Rider'),
    trajet: need(0.6, 0.86),
    trajetL: lbl(0.6, 0.86, 'Occasional evening trip', { align: 'right' }),
    newPracticeL: lbl(0.04, 0.78, 'New personal-transport practice', { color: WARDLEY_RED, w: 220 }),
    autonomyL: lbl(0.8, 0.84, 'Vehicle self-driving practice', { w: 240 }),
    // top pipeline: driving
    pipeDrive: pipeBox(0.13, 0.82, 0.78),
    drive1: comp(0.3, 0.78), drive1L: lbl(0.3, 0.78, 'Heavy-goods driving', { align: 'center', dy: 8, w: 180 }),
    taxi: comp(0.45, 0.78), taxiL: lbl(0.45, 0.78, 'Taxi', { align: 'center', dy: -26 }),
    vtc: comp(0.52, 0.78), vtcL: lbl(0.52, 0.78, 'VTC', { align: 'center', dy: -26 }),
    vtcU: comp(0.74, 0.78), vtcUL: lbl(0.74, 0.78, 'Uberised VTC', { align: 'center', dy: 8 }),
    autoDrive: future(0.88, 0.78), autoDriveL: lbl(0.88, 0.78, 'Automated driving', { color: WARDLEY_RED }),
    driveArrow: link('drive1', 'autoDrive', { red: true, arrow: true }),
    // mid pipeline: move
    pipeMove: pipeBox(0.27, 0.83, 0.5),
    velo: comp(0.3, 0.5), veloL: lbl(0.3, 0.5, 'By cargo bike', { align: 'right' }),
    bus: comp(0.62, 0.5), busL: lbl(0.62, 0.5, 'By bus', { align: 'center', dy: 8 }),
    moto: comp(0.66, 0.5), motoL: lbl(0.66, 0.5, 'By motorbike', { align: 'center', dy: 8 }),
    train: comp(0.7, 0.5), trainL: lbl(0.7, 0.5, 'By train', { align: 'center', dy: 8 }),
    car: comp(0.74, 0.5), carL: lbl(0.74, 0.5, 'By car', { align: 'center', dy: 8 }),
    bike: comp(0.8, 0.5), bikeL: lbl(0.8, 0.5, 'By bike', { align: 'center', dy: 8 }),
    moveNeed: need(0.86, 0.52), moveNeedL: lbl(0.86, 0.52, 'Get around'),
    // cargo-bike pipeline
    pipeCargo: pipeBox(0.07, 0.22, 0.32),
    tri: comp(0.1, 0.32), triL: lbl(0.1, 0.32, 'Tricycle', { align: 'center', dy: 8 }),
    bi: comp(0.18, 0.32), biL: lbl(0.18, 0.32, 'Two-wheeler', { align: 'center', dy: 8 }),
    cargoL: lbl(0.18, 0.34, 'Cargo bike', { dy: -26 }),
    // car pipeline (bottom)
    pipeCar: pipeBox(0.05, 0.84, 0.12),
    koenig: comp(0.08, 0.12), koenigL: lbl(0.08, 0.12, 'Koenigsegg', { align: 'center', dy: 8 }),
    robin: comp(0.15, 0.12), robinL: lbl(0.15, 0.12, 'Robin', { align: 'center', dy: 8 }),
    fiat: comp(0.22, 0.12), fiatL: lbl(0.22, 0.12, 'Fiat Multipla', { align: 'center', dy: 8 }),
    r5: comp(0.3, 0.12), r5L: lbl(0.3, 0.12, 'R5', { align: 'center', dy: 8 }),
    renault: comp(0.36, 0.12), renaultL: lbl(0.36, 0.12, 'Renault', { align: 'center', dy: 8 }),
    toyota: comp(0.62, 0.12), toyotaL: lbl(0.62, 0.12, 'Toyota', { align: 'center', dy: 8 }),
    autolib: comp(0.74, 0.12), autolibL: lbl(0.74, 0.12, 'Autolib', { align: 'center', dy: 8 }),
    citiz: comp(0.8, 0.12), citizL: lbl(0.8, 0.12, 'Citiz', { align: 'center', dy: 8 }),
    toyotaAuto: future(0.66, 0.12), toyotaAutoL: lbl(0.66, 0.12, 'Toyota autonomous', { color: WARDLEY_RED, dy: -26 }),
    carArrow: link('toyota', 'toyotaAuto', { red: true, arrow: true }),
    // structural links
    lk1: link('usager', 'trajet'),
    lk2: link('trajet', 'vtcU'),
    lk3: link('vtcU', 'car'),
    lk4: link('car', 'citiz'),
    lk5: link('velo', 'bi'),
    lk6: link('moveNeed', 'bike'),
  };
  return out;
}

// ── Value chain only (deposit-return distribution) ────────────────────
function valueChainOnly(): SurfaceElementsJSON {
  const perim = (e1: number, v1: number, e2: number, v2: number) =>
    panel(ex(e1), vy(v1), ex(e2) - ex(e1), vy(v2) - vy(v1));
  return {
    bg: bg(),
    title: freeText(360, 24, 900, 'Partial value chain of a deposit-return distribution firm (stakeholder needs)', 15),
    legend: panel(120, 90, 320, 150),
    legendT: freeText(132, 98, 300, 'Legend\n⊗ Stakeholder   ○ Need   ○ Capability\n▢ Value-chain actor perimeter\n— CO2-equivalent flow', 13),
    // top: consumer + needs + retail
    consumer: stake(0.55, 0.93), consumerL: lbl(0.55, 0.93, 'Supermarket consumer', { align: 'center', dy: -28, w: 240 }),
    getDeposit: need(0.4, 0.83), getDepositL: lbl(0.4, 0.83, 'Get my deposit back'),
    returnPack: need(0.4, 0.76), returnPackL: lbl(0.4, 0.76, 'Return the packaging'),
    product: need(0.63, 0.81), productL: lbl(0.63, 0.81, 'Product with container'),
    retail: comp(0.55, 0.72), retailL: lbl(0.55, 0.72, 'Mass retail'),
    // central purchasing perimeter
    cpPerim: perim(0.66, 0.42, 0.8, 0.68), cpL: freeText(ex(0.66), vy(0.68) - 24, 280, 'Retail central purchasing', 14),
    transTo: comp(0.72, 0.63), transToL: lbl(0.72, 0.63, 'Transport to store'),
    storeDirty: comp(0.72, 0.52), storeDirtyL: lbl(0.72, 0.52, 'Store the soiled'),
    transBack: comp(0.72, 0.47), transBackL: lbl(0.72, 0.47, 'Transport back'),
    trace: comp(0.72, 0.44), traceL: lbl(0.72, 0.44, 'Ensure traceability'),
    // food industry perimeter
    fiPerim: perim(0.3, 0.55, 0.42, 0.66), fiL: freeText(ex(0.3), vy(0.66) - 24, 220, 'Food industry', 14),
    fiProduct: comp(0.33, 0.6), fiProductL: lbl(0.33, 0.6, 'Product', { align: 'right' }),
    transform: comp(0.38, 0.58), transformL: lbl(0.38, 0.58, 'Transform'),
    // deposit distributor perimeter (the core actor)
    ddPerim: perim(0.27, 0.22, 0.55, 0.52), ddL: freeText(ex(0.27), vy(0.52) - 24, 260, 'Deposit distributor', 14),
    animate: comp(0.31, 0.46), animateL: lbl(0.31, 0.46, 'Animate'),
    training: comp(0.34, 0.45), trainingL: lbl(0.34, 0.45, 'Training know-how', { dy: 8 }),
    stock: comp(0.42, 0.46), stockL: lbl(0.42, 0.46, 'Container stock'),
    reservice: comp(0.47, 0.46), reserviceL: lbl(0.47, 0.46, 'Re-service used containers'),
    decontam: comp(0.43, 0.4), decontamL: lbl(0.43, 0.4, 'Decontaminate'),
    machine: comp(0.46, 0.32), machineL: lbl(0.46, 0.32, 'Auto-refund collection machine', { align: 'right' }),
    containerNew: comp(0.31, 0.28), containerNewL: lbl(0.31, 0.28, 'New container', { align: 'right', dy: 8 }),
    hardware: comp(0.37, 0.28), hardwareL: lbl(0.37, 0.28, 'Hardware', { dy: -22 }),
    tracer: comp(0.37, 0.23), tracerL: lbl(0.37, 0.23, 'Trace', { dy: 8 }),
    qr: comp(0.4, 0.22), qrL: lbl(0.4, 0.22, 'QR code', { dy: 8 }),
    internet: comp(0.48, 0.27), internetL: lbl(0.48, 0.27, 'Connect to internet', { align: 'right', dy: -22 }),
    software: comp(0.48, 0.24), softwareL: lbl(0.48, 0.24, 'Software', { dy: 8 }),
    mb: comp(0.5, 0.23), mbL: lbl(0.5, 0.23, 'Motherboard', { dy: 8 }),
    design: comp(0.3, 0.22), designL: lbl(0.3, 0.22, 'Design', { dy: 8 }),
    // fabricant perimeter
    fabPerim: perim(0.2, 0.23, 0.3, 0.3), fabL: freeText(ex(0.2), vy(0.3) - 24, 180, 'Manufacturer', 14),
    fabContainer: comp(0.22, 0.27), fabContainerL: lbl(0.22, 0.27, 'Make container', { align: 'right' }),
    mould: comp(0.27, 0.26), mouldL: lbl(0.27, 0.26, 'Mould'),
    // raw-material supplier pipelines (bottom)
    steel: comp(0.14, 0.13), steelL: lbl(0.14, 0.13, 'Steel (Arcelormittal)', { align: 'right', dy: 8 }),
    ore: comp(0.13, 0.06), oreL: lbl(0.13, 0.06, 'Iron ore (Kiruna)', { align: 'right', dy: 8 }),
    coal: comp(0.24, 0.06), coalL: lbl(0.24, 0.06, 'Coal (China)', { dy: 8 }),
    matter: comp(0.16, 0.18), matterL: lbl(0.16, 0.18, 'Material (Aperam)', { align: 'right', dy: 8 }),
    elec: comp(0.62, 0.16), elecL: lbl(0.62, 0.16, 'Electricity 220V (DSO)', { dy: 8 }),
    rte: comp(0.62, 0.1), rteL: lbl(0.62, 0.1, 'Transmission (RTE)', { dy: 8 }),
    edf: comp(0.64, 0.05), edfL: lbl(0.64, 0.05, 'Generation (EDF)', { dy: 8 }),
    transporter: comp(0.8, 0.4), transporterL: lbl(0.8, 0.4, 'Carrier'),
    laundry: comp(0.82, 0.3), laundryL: lbl(0.82, 0.3, 'Laundry'),
    water: comp(0.82, 0.06), waterL: lbl(0.82, 0.06, 'Water (Loire)', { dy: 8 }),
    // principal links
    k1: link('consumer', 'getDeposit'), k2: link('consumer', 'product'), k3: link('consumer', 'retail'),
    k4: link('getDeposit', 'returnPack'), k5: link('retail', 'transTo'), k6: link('product', 'transform'),
    k7: link('retail', 'reservice'), k8: link('reservice', 'machine'), k9: link('reservice', 'decontam'),
    k10: link('machine', 'hardware'), k11: link('hardware', 'fabContainer'), k12: link('fabContainer', 'matter'),
    k13: link('matter', 'steel'), k14: link('steel', 'ore'), k15: link('machine', 'internet'),
    k16: link('internet', 'elec'), k17: link('elec', 'rte'), k18: link('rte', 'edf'),
    k19: link('transBack', 'transporter'), k20: link('decontam', 'laundry'), k21: link('laundry', 'water'),
  };
}

// ── SaaSTech (sales-system map) ───────────────────────────────────────
function saasTech(): SurfaceElementsJSON {
  return {
    bg: bg(),
    title: freeText(180, 24, 1100, 'First Wardley map of the SaaSTech private-sector sales system, to tailor the commercial approach', 15),
    legend: panel(80, 110, 360, 200),
    legendT: freeText(92, 118, 340, 'Legend\n⊗ SaaSTech client\n▢ Set of possible choices\n◉ Need\n○ Future system capability (red)\n○ System capability', 13),
    note1: panel(140, 300, 240, 230), note1T: freeText(152, 308, 220, 'DSI environments are fairly well understood, as the SaaSTech solution shows. The needs emerging from them are new and at their genesis.', 13),
    note2: panel(560, 980, 280, 200), note2T: freeText(572, 988, 260, 'The training I offer focuses on business goals — never done before in the community. A more evolved version of the existing practice.', 13),
    note3: panel(1320, 980, 220, 130), note3T: freeText(1332, 988, 200, 'Observation is a key skill for mining needs; the training builds it.', 13),
    // stakeholder + needs
    actor: stake(0.55, 0.96), actorL: lbl(0.55, 0.96, 'Private actor (SME/mid-cap)', { align: 'center', dy: -28, w: 280 }),
    dsiNeed: need(0.1, 0.82), dsiNeedL: lbl(0.1, 0.82, 'DSI-related needs', { dy: -22 }),
    advertise: need(0.46, 0.82), advertiseL: lbl(0.46, 0.82, 'Advertise & learn their needs'),
    budget: need(0.55, 0.79), budgetL: lbl(0.55, 0.79, 'Manage & centralise my DSI budget'),
    organise: need(0.82, 0.78), organiseL: lbl(0.82, 0.78, 'Run & lead my team'),
    portfolio: need(0.55, 0.7), portfolioL: lbl(0.55, 0.7, 'Steer my project portfolio'),
    contract: comp(0.7, 0.7), contractL: lbl(0.7, 0.7, 'Optimise contract & supplier follow-up'),
    update: need(0.6, 0.62), updateL: lbl(0.6, 0.62, 'Update'),
    // pipeline of DSI-management needs (top right)
    dsiPipe: pipeBox(0.55, 0.92, 0.74),
    dsiPipeL: freeText(ex(0.55), vy(0.74) - 24, 280, 'Four DSI-management needs', 14),
    priceHT: comp(0.9, 0.74), priceHTL: lbl(0.9, 0.74, 'Price ex-VAT'),
    support: comp(0.66, 0.74), supportL: lbl(0.66, 0.74, 'Client support', { color: '#bbbbbb' }),
    // capabilities
    closing: comp(0.5, 0.66), closingL: lbl(0.5, 0.66, 'Closing', { align: 'center', dy: -24 }),
    prospect: comp(0.42, 0.62), prospectL: lbl(0.42, 0.62, 'Prospecting', { align: 'right' }),
    args: comp(0.42, 0.55), argsL: lbl(0.42, 0.55, 'Sector sales arguments', { align: 'right' }),
    saas: comp(0.46, 0.5), saasL: lbl(0.46, 0.5, 'SaaS module ex-VAT', { align: 'right' }),
    script: comp(0.82, 0.58), scriptL: lbl(0.82, 0.58, 'Script'),
    objections: comp(0.74, 0.52), objectionsL: lbl(0.74, 0.52, 'Objections'),
    marketing: comp(0.48, 0.42), marketingL: lbl(0.48, 0.42, 'Marketing info', { align: 'center', dy: 8 }),
    improve: comp(0.84, 0.42), improveL: lbl(0.84, 0.42, 'Continuous improvement'),
    sensePipe: pipeBox(0.1, 0.72, 0.3),
    sensePipeL: freeText(ex(0.6), vy(0.3) + 12, 220, 'Make sense of needs', 13),
    classic: comp(0.72, 0.3), classicL: lbl(0.72, 0.3, 'Classic discussions'),
    trainWardley: future(0.4, 0.3), trainWardleyL: lbl(0.4, 0.3, 'Training on Wardley maps'),
    discussWardley: future(0.1, 0.3), discussWardleyL: lbl(0.1, 0.3, 'Discussion with Wardley maps', { color: WARDLEY_RED, dy: -24 }),
    cs: comp(0.6, 0.18), csL: lbl(0.6, 0.18, 'Customer success', { align: 'right' }),
    identify: comp(0.7, 0.22), identifyL: lbl(0.7, 0.22, 'Identify the needs'),
    phoning: comp(0.78, 0.16), phoningL: lbl(0.78, 0.16, 'Phoning'),
    chat: comp(0.74, 0.13), chatL: lbl(0.74, 0.13, 'Live chat'),
    onboard: comp(0.72, 0.1), onboardL: lbl(0.72, 0.1, 'Onboarding'),
    observe: comp(0.5, 0.07), observeL: lbl(0.5, 0.07, 'Observation', { align: 'center', dy: 8 }),
    dataviz: comp(0.62, 0.07), datavizL: lbl(0.62, 0.07, 'Data visualisation'),
    collect: comp(0.6, 0.03), collectL: lbl(0.6, 0.03, 'Data-collection device', { dy: 8 }),
    // links
    n1: link('actor', 'advertise'), n2: link('actor', 'budget'), n3: link('actor', 'organise'),
    n4: link('actor', 'portfolio'), n5: link('actor', 'contract'), n6: link('dsiNeed', 'saas'),
    n7: link('advertise', 'closing'), n8: link('closing', 'prospect'), n9: link('prospect', 'args'),
    n10: link('args', 'saas'), n11: link('budget', 'update'), n12: link('update', 'script'),
    n13: link('portfolio', 'marketing'), n14: link('cs', 'identify'), n15: link('cs', 'phoning'),
    n16: link('cs', 'onboard'), n17: link('identify', 'observe'), n18: link('identify', 'collect'),
    n19: link('saas', 'marketing'), n20: link('classic', 'cs'),
    // future (red) links from "Discussion with Wardley maps"
    r1: link('discussWardley', 'saas', { red: true }),
    r2: link('discussWardley', 'marketing', { red: true }),
    r3: link('discussWardley', 'improve', { red: true }),
    r4: link('discussWardley', 'identify', { red: true }),
    ra: link('discussWardley', 'trainWardley', { red: true, arrow: true }),
  };
}

export const wardleyMaps: Template[] = [
  tpl('Tea Shop', mapPreview('<circle cx="78" cy="24" r="3" fill="#fff" stroke="#1f2328"/><circle cx="50" cy="44" r="3" fill="#fff" stroke="#1f2328"/><circle cx="86" cy="40" r="3" fill="#fff" stroke="#1f2328"/><circle cx="92" cy="58" r="3" fill="#fff" stroke="#1f2328"/><path d="M78 24 L50 44 M78 24 L86 40 L92 58" stroke="#666"/><path d="M50 44 h22" stroke="#d6455d" stroke-dasharray="3 2"/>'), teaShop()),
  tpl('Kodak inertia', mapPreview('<circle cx="56" cy="22" r="3" fill="#fff" stroke="#1f2328"/><circle cx="54" cy="40" r="3" fill="#fff" stroke="#1f2328"/><circle cx="86" cy="40" r="3" fill="#fff" stroke="#d6455d"/><rect x="76" y="35" width="2.5" height="11" fill="#1f2328"/><path d="M57 40 h17" stroke="#d6455d" stroke-dasharray="3 2"/>'), kodak()),
  tpl('Pipeline usage', mapPreview('<rect x="34" y="26" width="70" height="9" stroke="#1f2328" stroke-width="0.8"/><rect x="40" y="44" width="64" height="9" stroke="#1f2328" stroke-width="0.8"/><circle cx="48" cy="30.5" r="2" fill="#fff" stroke="#1f2328"/><circle cx="78" cy="30.5" r="2" fill="#fff" stroke="#1f2328"/><circle cx="60" cy="48.5" r="2" fill="#fff" stroke="#1f2328"/>'), taxiPipelines()),
  tpl('Value chain only', mapPreview('<rect x="40" y="20" width="40" height="30" stroke="#1f2328" stroke-width="0.8"/><circle cx="80" cy="18" r="3" fill="#fff" stroke="#1f2328"/><circle cx="50" cy="30" r="2" fill="#fff" stroke="#1f2328"/><circle cx="66" cy="40" r="2" fill="#fff" stroke="#1f2328"/><path d="M80 18 L50 30 M80 18 L66 40" stroke="#666"/>'), valueChainOnly()),
  tpl('SaaSTech', mapPreview('<circle cx="74" cy="18" r="3" fill="#fff" stroke="#1f2328"/><circle cx="50" cy="34" r="2.5" fill="#fff" stroke="#1f2328" stroke-width="1.5"/><circle cx="40" cy="52" r="2.5" fill="#fff" stroke="#d6455d"/><path d="M74 18 L50 34 M40 52 L70 44" stroke="#666"/><path d="M40 52 L66 40" stroke="#d6455d"/>'), saasTech()),
];
