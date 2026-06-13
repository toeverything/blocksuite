import {
  makeTemplateSnapshot,
  type SurfaceElementsJSON,
  surfaceText,
  type Template,
  type TemplateCategory,
} from '@labre/affine-gfx-template';
import {
  ConnectorMode,
  FontFamily,
  PointStyle,
  ShapeStyle,
  StrokeStyle,
  TextAlign,
} from '@labre/affine-model';

import { REF_H, REF_W } from '../consts';
import {
  ACTIVITY_VERTICES,
  INNER_FONT_SIZE,
  NODE_FILL,
  NODE_STROKE,
  NODE_STROKE_WIDTH,
  OUTCOME_RADIUS,
} from '../node/consts';

// EDGY facet palette (header / pale sub-card).
const C = {
  identity: ['#1ec873', '#9fe6c2'],
  organisation: ['#4fd0ea', '#c2eef8'],
  architecture: ['#2f6ff0', '#b3c8f7'],
  product: ['#cf8cff', '#e7ccff'],
  experience: ['#f5246e', '#ffc0d4'],
  brand: ['#eeba51', '#f7e1ad'],
} as const;
const JOURNEY_PINK = '#f3a3c0';

// ── element helpers ───────────────────────────────────────────────────
function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; stroke?: string; sw?: number; radius?: number; text?: string; textColor?: string; fontSize?: number } = {}
) {
  const el: Record<string, unknown> = {
    type: 'shape',
    shapeType: 'rect',
    filled: true,
    fillColor: opts.fill ?? '#ffffff',
    strokeColor: opts.stroke ?? NODE_STROKE,
    strokeWidth: opts.sw ?? NODE_STROKE_WIDTH,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    radius: opts.radius ?? 0,
    xywh: `[${x},${y},${w},${h}]`,
  };
  if (opts.text != null) {
    el.text = surfaceText(opts.text);
    el.color = opts.textColor ?? NODE_STROKE;
    el.fontFamily = FontFamily.Inter;
    el.fontSize = opts.fontSize ?? 16;
    el.textAlign = TextAlign.Center;
  }
  return el;
}

/** An EDGY node (kind drives the native shape): outcome/object box, people, activity chevron. */
function enode(
  kind: 'outcome' | 'object' | 'people' | 'activity',
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; text?: string; textColor?: string; fontSize?: number } = {}
) {
  const el: Record<string, unknown> = {
    type: 'edgyNode',
    kind,
    filled: true,
    fillColor: opts.fill ?? NODE_FILL,
    strokeColor: NODE_STROKE,
    strokeWidth: kind === 'people' ? 0 : NODE_STROKE_WIDTH,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    shapeType: kind === 'people' ? 'ellipse' : kind === 'activity' ? 'polygon' : 'rect',
    radius: kind === 'outcome' ? OUTCOME_RADIUS : 0,
    xywh: `[${x},${y},${w},${h}]`,
  };
  if (kind === 'activity') el.vertices = ACTIVITY_VERTICES;
  if (opts.text != null) {
    el.text = surfaceText(opts.text);
    el.color = opts.textColor ?? NODE_STROKE;
    el.fontFamily = FontFamily.Inter;
    el.fontSize = opts.fontSize ?? INNER_FONT_SIZE;
    el.textAlign = TextAlign.Center;
  }
  return el;
}

function label(x: number, y: number, w: number, h: number, str: string, opts: { color?: string; fontSize?: number; align?: TextAlign } = {}) {
  return {
    type: 'text',
    text: surfaceText(str),
    color: opts.color ?? NODE_STROKE,
    fontFamily: FontFamily.Inter,
    fontSize: opts.fontSize ?? 16,
    textAlign: opts.align ?? TextAlign.Center,
    xywh: `[${x},${y},${w},${h}]`,
  };
}

function line(x1: number, y1: number, x2: number, y2: number, opts: { arrow?: boolean; dash?: boolean; sw?: number } = {}) {
  return {
    type: 'connector',
    mode: ConnectorMode.Orthogonal,
    stroke: NODE_STROKE,
    strokeWidth: opts.sw ?? 2,
    strokeStyle: opts.dash ? StrokeStyle.Dash : StrokeStyle.Solid,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: opts.arrow ? PointStyle.Triangle : PointStyle.None,
    source: { position: [x1, y1] },
    target: { position: [x2, y2] },
  };
}

// ── Facets overview (six facets, sub-cards, facets/intersections) ─────
function facetsOverview(): SurfaceElementsJSON {
  const out: SurfaceElementsJSON = {};
  const tall = (key: keyof typeof C, x: number, name: string, cards: [string, string, string]) => {
    const [hdr, sub] = C[key];
    out[`${key}F`] = rect(x, 140, 192, 460, { fill: hdr, stroke: hdr, radius: 16 });
    out[`${key}N`] = label(x, 168, 192, 28, name, { color: '#ffffff', fontSize: 18 });
    out[`${key}1`] = rect(x + 16, 208, 160, 80, { fill: sub, stroke: sub, radius: 6, text: cards[0], fontSize: 16 });
    out[`${key}2`] = rect(x + 16, 300, 160, 80, { fill: sub, stroke: sub, radius: 6, text: cards[1], fontSize: 16 });
    out[`${key}3`] = enode('activity', x + 16, 392, 160, 84, { fill: sub, text: cards[2], fontSize: 16 });
  };
  const low = (key: keyof typeof C, x: number, name: string) => {
    const [hdr, sub] = C[key];
    out[`${key}F`] = rect(x, 300, 192, 424, { fill: hdr, stroke: hdr, radius: 16 });
    out[`${key}1`] = rect(x + 16, 360, 160, 92, { fill: sub, stroke: sub, radius: 6, text: name, fontSize: 16 });
    out[`${key}N`] = label(x, 686, 192, 28, name, { color: '#ffffff', fontSize: 18 });
  };
  // lower facets first (drawn behind the tall ones at the overlaps)
  low('organisation', 240, 'Organisation');
  low('product', 664, 'Product');
  low('brand', 1088, 'Brand');
  tall('identity', 40, 'Identity', ['Purpose', 'Content', 'Story']);
  tall('architecture', 464, 'Architecture', ['Capability', 'Asset', 'Process']);
  tall('experience', 888, 'Experience', ['Task', 'Channel', 'Journey']);
  out.fLabel = label(464, 80, 192, 28, 'Facets', { fontSize: 18 });
  out.fBar = line(136, 120, 984, 120);
  out.iLabel = label(664, 740, 192, 28, 'Intersections', { fontSize: 18 });
  out.iBar = line(336, 728, 1184, 728);
  return out;
}

// ── Customer journey ──────────────────────────────────────────────────
function journey(): SurfaceElementsJSON {
  const step = (i: number, x: number) =>
    enode('activity', x, 132, 224, 116, { fill: JOURNEY_PINK, text: `Journey step ${i}`, textColor: '#ffffff', fontSize: 18 });
  const ch = (x: number, n: string) => enode('object', x, 392, 184, 96, { fill: JOURNEY_PINK, text: `Channel ${n}`, fontSize: 16 });
  const tk = (x: number, n: string) => enode('object', x, 540, 168, 92, { fill: JOURNEY_PINK, text: `Task ${n}`, fontSize: 16 });
  return {
    cust: enode('people', 40, 120, 64, 64, { fill: '#ffffff' }),
    custL: label(20, 192, 104, 24, 'Customer', { fontSize: 14 }),
    band: { type: 'shape', shapeType: 'polygon', vertices: [[0, 0], [0.86, 0], [1, 0.5], [0.86, 1], [0, 1]], filled: true, fillColor: JOURNEY_PINK, strokeColor: JOURNEY_PINK, strokeWidth: 1, shapeStyle: ShapeStyle.General, roughness: 0, xywh: '[150,108,860,164]' },
    bandL: label(170, 116, 120, 24, 'Journey', { color: '#ffffff', fontSize: 16, align: TextAlign.Left }),
    s1: step(1, 240),
    s2: step(2, 500),
    s3: step(3, 760),
    rightTask: enode('object', 1060, 132, 168, 92, { text: 'Task', fontSize: 16 }),
    c1: ch(258, 'X'), c2: ch(518, 'Y'), c3: ch(778, 'Z'),
    t1: tk(266, 'A'), t2: tk(526, 'B'), t3: tk(786, 'C'),
    trav1: label(258, 350, 184, 20, 'traverses', { fontSize: 13, color: '#5f6368' }),
    trav2: label(518, 350, 184, 20, 'traverses', { fontSize: 13, color: '#5f6368' }),
    trav3: label(778, 350, 184, 20, 'traverses', { fontSize: 13, color: '#5f6368' }),
    use1: label(258, 504, 184, 20, 'uses', { fontSize: 13, color: '#5f6368' }),
    use2: label(518, 504, 184, 20, 'uses', { fontSize: 13, color: '#5f6368' }),
    use3: label(778, 504, 184, 20, 'uses', { fontSize: 13, color: '#5f6368' }),
    l1: line(350, 248, 350, 392), l2: line(610, 248, 610, 392), l3: line(870, 248, 870, 392),
    l4: line(350, 488, 350, 540), l5: line(610, 488, 610, 540), l6: line(870, 488, 870, 540),
  };
}

// ── Service blueprint (six swimlanes) ─────────────────────────────────
function blueprint(): SurfaceElementsJSON {
  const lanes = ['Physical Evidence', 'Customer Actions', 'On-stage Actions', 'Back-stage Actions', 'Support Processes', 'Support Systems'];
  const laneFill = ['#fdeef2', '#fbd5e0', '#dff0fb', '#d4e9f8', '#d4e9f8', '#d4e9f8'];
  const out: SurfaceElementsJSON = {};
  lanes.forEach((name, i) => {
    const y = 40 + i * 150;
    out[`lane${i}`] = rect(36, y, 1280, 150, { fill: laneFill[i], stroke: laneFill[i], sw: 0 });
    out[`laneL${i}`] = label(52, y + 12, 260, 22, name, { fontSize: 15, align: TextAlign.Left });
  });
  const chev = (x: number, y: number, fill: string, t: string) => enode('activity', x, y, 200, 60, { fill, text: t, fontSize: 14 });
  const box = (x: number, y: number, fill: string, t: string) => enode('object', x, y, 200, 60, { fill, text: t, fontSize: 14 });
  const P = C.experience[1], B = C.architecture[1];
  Object.assign(out, {
    af: rect(280, 64, 220, 70, { text: 'Admission Form' }),
    cf: rect(1010, 64, 220, 70, { text: 'Confirmation' }),
    sf: chev(280, 214, P, 'Send Form'), fs: chev(600, 214, P, 'Follow status'), rd: chev(1010, 214, P, 'Receive decision'),
    fh: chev(280, 364, B, 'Form handling'), cs: chev(600, 364, B, 'Customer support'), ct: chev(1010, 364, B, 'Contact'),
    csv: chev(280, 514, B, 'Customer service'), cfu: box(1010, 514, B, 'Customer follow-up'),
    pf: chev(600, 664, B, 'Process Form'), dec: chev(900, 664, B, 'Decision [Accept|Reject]'),
    crm: box(280, 814, B, 'CRM Application'), cms: box(600, 814, B, 'Case Management'), pay: box(900, 814, B, 'Payments System'),
    a1: line(380, 134, 380, 214, { arrow: true }),
    a2: line(480, 244, 600, 244, { arrow: true }),
    a3: line(800, 244, 1010, 244, { arrow: true }),
    a4: line(320, 274, 320, 364, { arrow: true }),
    a5: line(320, 424, 320, 514, { arrow: true }),
    a6: line(700, 724, 900, 694, { arrow: true }),
    a7: line(380, 874, 600, 844, { arrow: true }),
    a8: line(800, 844, 900, 844, { arrow: true }),
  });
  return out;
}

// ── Organisation chart ────────────────────────────────────────────────
function orgChart(): SurfaceElementsJSON {
  const cyan = C.organisation[0];
  const u = (x: number, y: number, w: number, t: string) => enode('object', x, y, w, 64, { fill: cyan, text: t, fontSize: 16 });
  return {
    org: u(420, 40, 180, 'Organisation'),
    a: u(120, 200, 200, 'Business Unit A'), b: u(410, 200, 200, 'Business Unit B'), c: u(700, 200, 200, 'Business Unit C'),
    a1: u(60, 360, 170, 'Group A-1'), a2: u(260, 360, 170, 'Group A-2'), c1: u(715, 360, 170, 'Group C-1'),
    e1: line(510, 104, 510, 150), e2: line(220, 150, 800, 150),
    e3: line(220, 150, 220, 200), e4: line(510, 150, 510, 200), e5: line(800, 150, 800, 200),
    e6: line(220, 264, 220, 320), e7: line(145, 320, 345, 320),
    e8: line(145, 320, 145, 360), e9: line(345, 320, 345, 360),
    e10: line(800, 264, 800, 360),
  };
}

const single = (el: Record<string, unknown>): SurfaceElementsJSON => ({ a: el });
const ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';
function tpl(name: string, preview: string, elements: SurfaceElementsJSON): Template {
  return { name, type: 'template', preview, content: makeTemplateSnapshot(elements, name) };
}

export const edgyTemplateCategory: TemplateCategory = {
  name: 'EDGY',
  templates: [
    tpl('Facets overview', `<svg ${ATTRS} fill="none"><rect x="6" y="20" width="18" height="46" rx="3" fill="#1ec873"/><rect x="46" y="20" width="18" height="46" rx="3" fill="#2f6ff0"/><rect x="86" y="20" width="18" height="46" rx="3" fill="#f5246e"/><rect x="26" y="30" width="18" height="40" rx="3" fill="#4fd0ea"/><rect x="66" y="30" width="18" height="40" rx="3" fill="#cf8cff"/><rect x="106" y="30" width="18" height="40" rx="3" fill="#eeba51"/></svg>`, facetsOverview()),
    tpl('Customer journey', `<svg ${ATTRS} fill="none"><path d="M20 24 H110 L122 40 L110 56 H20 Z" fill="#f3a3c0"/><rect x="26" y="30" width="22" height="20" fill="none" stroke="#fff"/><rect x="54" y="30" width="22" height="20" fill="none" stroke="#fff"/><rect x="82" y="30" width="22" height="20" fill="none" stroke="#fff"/></svg>`, journey()),
    tpl('Service blueprint', `<svg ${ATTRS} fill="none"><rect x="8" y="14" width="119" height="16" fill="#fbd5e0"/><rect x="8" y="32" width="119" height="34" fill="#d4e9f8"/><rect x="20" y="18" width="22" height="9" fill="#f5246e" opacity="0.5"/><rect x="20" y="40" width="22" height="9" fill="#2f6ff0" opacity="0.4"/><rect x="60" y="40" width="22" height="9" fill="#2f6ff0" opacity="0.4"/></svg>`, blueprint()),
    tpl('Organisation chart', `<svg ${ATTRS} fill="none"><rect x="52" y="12" width="32" height="14" rx="2" fill="#4fd0ea"/><rect x="14" y="38" width="32" height="14" rx="2" fill="#4fd0ea"/><rect x="52" y="38" width="32" height="14" rx="2" fill="#4fd0ea"/><rect x="90" y="38" width="32" height="14" rx="2" fill="#4fd0ea"/><path d="M68 26 V32 M30 32 H106 M30 32 V38 M68 32 V38 M106 32 V38" stroke="#262626"/></svg>`, orgChart()),
    tpl('Facets diagram', `<svg ${ATTRS}><circle cx="55" cy="34" r="18" fill="#00ea4e" opacity="0.9"/><circle cx="80" cy="34" r="18" fill="#034cee" opacity="0.9"/><circle cx="67" cy="54" r="18" fill="#ff0056" opacity="0.9"/></svg>`, single({ type: 'edgy', xywh: `[0,0,${REF_W * 1.5},${REF_H * 1.5}]` })),
    tpl('People', `<svg ${ATTRS} fill="#262626"><circle cx="67" cy="32" r="9" fill="none" stroke="#262626" stroke-width="2.4"/><path d="M50 60 a17 17 0 0 1 34 0" fill="none" stroke="#262626" stroke-width="2.4"/></svg>`, { n: enode('people', 0, 0, 64, 64), l: label(-28, 70, 120, 24, 'People', { fontSize: 16 }) }),
    tpl('Outcome', `<svg ${ATTRS} fill="none"><rect x="20" y="24" width="95" height="34" rx="6" stroke="#262626" stroke-width="2"/></svg>`, single(enode('outcome', 0, 0, 130, 80, { text: 'Outcome' }))),
    tpl('Object', `<svg ${ATTRS} fill="none"><rect x="20" y="24" width="95" height="34" stroke="#262626" stroke-width="2"/></svg>`, single(enode('object', 0, 0, 130, 80, { text: 'Object' }))),
    tpl('Activity', `<svg ${ATTRS} fill="none"><path d="M20 24 H98 L116 41 H116 L98 58 H20 Z" stroke="#262626" stroke-width="2" stroke-linejoin="round"/></svg>`, single(enode('activity', 0, 0, 140, 80, { text: 'Activity' }))),
  ],
};
