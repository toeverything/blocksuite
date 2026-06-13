import {
  ConnectorMode,
  FontFamily,
  FontWeight,
  PointStyle,
  ShapeStyle,
  StrokeStyle,
  TextAlign,
} from '@labre/affine-model';

import {
  makeTemplateSnapshot,
  type SurfaceElementsJSON,
  surfaceText,
} from '../make-snapshot.js';
import type { Template, TemplateCategory } from '../toolbar/template-type.js';

/**
 * The generic ("Other") diagrams: built ONLY from general BlockSuite shapes
 * (`shape` rect/polygon, `text`, `connector`) per the composition principle —
 * they belong to no framework, so they ship from the template package itself.
 */

const DARK = '#262626';
const MUTED = '#9aa0a6';

type RectOpts = {
  fill?: string;
  stroke?: string;
  sw?: number;
  radius?: number;
  dash?: boolean;
  shapeType?: 'rect' | 'ellipse' | 'diamond' | 'polygon';
  vertices?: number[][];
  text?: string;
  textColor?: string;
  fontSize?: number;
};

function rect(x: number, y: number, w: number, h: number, opts: RectOpts = {}) {
  const el: Record<string, unknown> = {
    type: 'shape',
    shapeType: opts.shapeType ?? 'rect',
    filled: true,
    fillColor: opts.fill ?? '#ffffff',
    strokeColor: opts.stroke ?? DARK,
    strokeWidth: opts.sw ?? 2,
    strokeStyle: opts.dash ? StrokeStyle.Dash : StrokeStyle.Solid,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    radius: opts.radius ?? 0,
    xywh: `[${x},${y},${w},${h}]`,
  };
  if (opts.vertices) el.vertices = opts.vertices;
  if (opts.text != null) {
    el.text = surfaceText(opts.text);
    el.color = opts.textColor ?? DARK;
    el.fontFamily = FontFamily.Inter;
    el.fontSize = opts.fontSize ?? 14;
    el.textAlign = TextAlign.Center;
  }
  return el;
}

type LabelOpts = {
  color?: string;
  fontSize?: number;
  align?: TextAlign;
  weight?: FontWeight;
};

function label(
  x: number,
  y: number,
  w: number,
  h: number,
  str: string,
  opts: LabelOpts = {}
) {
  return {
    type: 'text',
    text: surfaceText(str),
    color: opts.color ?? '#1a1a1a',
    fontFamily: FontFamily.Inter,
    fontSize: opts.fontSize ?? 16,
    fontWeight: opts.weight ?? FontWeight.Regular,
    textAlign: opts.align ?? TextAlign.Left,
    xywh: `[${x},${y},${w},${h}]`,
  };
}

type LineOpts = {
  stroke?: string;
  sw?: number;
  dash?: boolean;
  arrow?: boolean;
  mode?: ConnectorMode;
};

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: LineOpts = {}
) {
  return {
    type: 'connector',
    mode: opts.mode ?? ConnectorMode.Straight,
    stroke: opts.stroke ?? DARK,
    strokeWidth: opts.sw ?? 2,
    strokeStyle: opts.dash ? StrokeStyle.Dash : StrokeStyle.Solid,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: opts.arrow ? PointStyle.Triangle : PointStyle.None,
    source: { position: [x1, y1] },
    target: { position: [x2, y2] },
  };
}

// ── SWOT (window-mullion quadrant, black labels) ──────────────────────
function swot(): SurfaceElementsJSON {
  const M = { fontSize: 22, weight: FontWeight.Medium } as const;
  return {
    box: rect(0, 0, 520, 340),
    v: line(260, 0, 260, 340),
    h: line(0, 170, 520, 170),
    s: label(24, 24, 220, 30, 'Strengths', M),
    w: label(284, 24, 220, 30, 'Weaknesses', M),
    o: label(24, 194, 220, 30, 'Opportunities', M),
    t: label(284, 194, 220, 30, 'Threats', M),
  };
}

// ── Kanban (To do / Doing / Done) ─────────────────────────────────────
function kanban(): SurfaceElementsJSON {
  const colOpts = { fill: '#f4f4f5', stroke: MUTED, sw: 1.5, radius: 10 };
  const head = { fontSize: 18, weight: FontWeight.Medium, align: TextAlign.Center } as const;
  const card = (x: number, y: number, fill: string, stroke: string) =>
    rect(x, y, 188, 60, { fill, stroke, sw: 1.5, radius: 8, text: 'Card', fontSize: 14 });
  return {
    c1: rect(0, 0, 220, 420, colOpts),
    c2: rect(244, 0, 220, 420, colOpts),
    c3: rect(488, 0, 220, 420, colOpts),
    h1: label(0, 16, 220, 24, 'To do', head),
    h2: label(244, 16, 220, 24, 'Doing', head),
    h3: label(488, 16, 220, 24, 'Done', head),
    a1: card(16, 56, '#fde6c8', '#e0a23a'),
    a2: card(16, 128, '#fde6c8', '#e0a23a'),
    b1: card(260, 56, '#d6e4fb', '#4574c4'),
    d1: card(504, 56, '#d5efd9', '#43a06b'),
    d2: card(504, 128, '#d5efd9', '#43a06b'),
  };
}

// ── Business Model Canvas (Strategyzer 9-block layout) ────────────────
function bmc(): SurfaceElementsJSON {
  const blk = { stroke: DARK, sw: 1.5 } as const;
  const t = (x: number, y: number, s: string) =>
    label(x + 12, y + 12, 180, 22, s, { fontSize: 14, weight: FontWeight.Medium });
  const hdr = (x: number, s: string) => ({
    box: rect(x, 8, 128, 34, { stroke: MUTED, sw: 1 }),
    txt: label(x + 8, 16, 120, 18, s, { fontSize: 11, color: '#5f6368' }),
  });
  const h1 = hdr(470, 'Designed for');
  const h2 = hdr(602, 'Designed by');
  const h3 = hdr(734, 'Date');
  const h4 = hdr(866, 'Version');
  return {
    title: label(0, 8, 440, 32, 'Business model canvas', {
      fontSize: 24,
      weight: FontWeight.Medium,
    }),
    h1b: h1.box, h1t: h1.txt, h2b: h2.box, h2t: h2.txt,
    h3b: h3.box, h3t: h3.txt, h4b: h4.box, h4t: h4.txt,
    kp: rect(0, 56, 196, 300, blk), ka: rect(200, 56, 196, 146, blk),
    kr: rect(200, 206, 196, 150, blk), vp: rect(400, 56, 196, 300, blk),
    cr: rect(600, 56, 196, 146, blk), ch: rect(600, 206, 196, 150, blk),
    cs: rect(800, 56, 196, 300, blk),
    cost: rect(0, 360, 496, 84, blk), rev: rect(500, 360, 496, 84, blk),
    tkp: t(0, 56, 'Key partnerships'), tka: t(200, 56, 'Key activities'),
    tkr: t(200, 206, 'Key resources'), tvp: t(400, 56, 'Value propositions'),
    tcr: t(600, 56, 'Customer relationships'), tch: t(600, 206, 'Channels'),
    tcs: t(800, 56, 'Customer segments'),
    tcost: t(0, 360, 'Cost structure'), trev: t(500, 360, 'Revenue streams'),
  };
}

// ── Fishbone / Ishikawa (spine + arrowhead bones + CATEGORY/ITEM) ─────
function fishbone(): SurfaceElementsJSON {
  const cat = (x: number, y: number) =>
    rect(x, y, 150, 44, { text: 'CATEGORY', fontSize: 13 });
  const item = (x: number, y: number, n: string) =>
    rect(x, y, 130, 40, { stroke: MUTED, sw: 1.4, dash: true, text: n, textColor: '#5f6368', fontSize: 13 });
  const out: SurfaceElementsJSON = {
    spine: line(80, 360, 1120, 360, { sw: 6 }),
    head: rect(1124, 332, 130, 56, { text: 'Effect', fontSize: 16 }),
  };
  // two rib-groups (junctions at x = 360 and 760)
  [360, 760].forEach((jx, g) => {
    const ox = jx - 360;
    out[`ub${g}`] = line(ox + 200, 250, jx, 358, { sw: 3, arrow: true });
    out[`lb${g}`] = line(ox + 200, 470, jx, 362, { sw: 3, arrow: true });
    out[`uc${g}`] = cat(ox + 150, 224);
    out[`lc${g}`] = cat(ox + 150, 452);
    out[`ui1${g}`] = item(ox + 130, 286, 'ITEM 1');
    out[`ui2${g}`] = item(ox + 170, 326, 'ITEM 2');
    out[`li1${g}`] = item(ox + 130, 396, 'ITEM 1');
    out[`li2${g}`] = item(ox + 170, 356, 'ITEM 2');
  });
  return out;
}

// ── Gantt chart ───────────────────────────────────────────────────────
function gantt(): SurfaceElementsJSON {
  const rows = ['Discovery', 'Design', 'Build', 'Launch'];
  const bars: [number, number, string][] = [
    [220, 280, '#4574c4'],
    [340, 360, '#2f9e95'],
    [520, 420, '#d99a2b'],
    [760, 240, '#43a06b'],
  ];
  const out: SurfaceElementsJSON = {};
  // week gridlines + labels
  for (let i = 0; i < 6; i++) {
    const x = 220 + i * 130;
    out[`g${i}`] = line(x, 40, x, 268, { stroke: '#e0e0e0', sw: 1 });
    out[`w${i}`] = label(x - 16, 12, 40, 20, `W${i + 1}`, { fontSize: 12, color: '#5f6368', align: TextAlign.Center });
  }
  rows.forEach((name, r) => {
    const y = 56 + r * 52;
    out[`t${r}`] = label(0, y + 6, 180, 24, name, { fontSize: 14 });
    const [bx, bw, fill] = bars[r];
    out[`b${r}`] = rect(bx, y, bw, 28, { fill, stroke: fill, sw: 0, radius: 6 });
  });
  return out;
}

const ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';
const previews = {
  swot: `<svg ${ATTRS} fill="none"><rect x="20" y="12" width="95" height="56" stroke="#262626" stroke-width="2"/><path d="M67.5 12 V68 M20 40 H115" stroke="#262626" stroke-width="1.6"/></svg>`,
  kanban: `<svg ${ATTRS} fill="none"><rect x="10" y="12" width="35" height="56" rx="4" stroke="#9aa0a6"/><rect x="50" y="12" width="35" height="56" rx="4" stroke="#9aa0a6"/><rect x="90" y="12" width="35" height="56" rx="4" stroke="#9aa0a6"/><rect x="15" y="22" width="25" height="11" rx="2" fill="#fde6c8"/><rect x="55" y="22" width="25" height="11" rx="2" fill="#d6e4fb"/><rect x="95" y="22" width="25" height="11" rx="2" fill="#d5efd9"/></svg>`,
  bmc: `<svg ${ATTRS} fill="none"><g stroke="#262626" stroke-width="1.2"><rect x="8" y="14" width="22" height="40"/><rect x="32" y="14" width="22" height="20"/><rect x="32" y="35" width="22" height="19"/><rect x="56" y="14" width="22" height="40"/><rect x="80" y="14" width="22" height="20"/><rect x="80" y="35" width="22" height="19"/><rect x="104" y="14" width="22" height="40"/><rect x="8" y="56" width="57" height="14"/><rect x="68" y="56" width="58" height="14"/></g></svg>`,
  fishbone: `<svg ${ATTRS} fill="none"><path d="M14 40 H112" stroke="#262626" stroke-width="3"/><rect x="112" y="33" width="20" height="14" stroke="#262626" stroke-width="1.4"/><path d="M40 18 L52 40 M40 62 L52 40 M84 18 L96 40 M84 62 L96 40" stroke="#262626" stroke-width="1.4"/></svg>`,
  gantt: `<svg ${ATTRS} fill="none"><path d="M40 14 V70 M62 14 V70 M84 14 V70 M106 14 V70" stroke="#e0e0e0"/><rect x="40" y="22" width="34" height="8" rx="2" fill="#4574c4"/><rect x="52" y="36" width="44" height="8" rx="2" fill="#2f9e95"/><rect x="62" y="50" width="50" height="8" rx="2" fill="#d99a2b"/><rect x="84" y="64" width="28" height="8" rx="2" fill="#43a06b"/></svg>`,
};

function t(name: string, preview: string, elements: SurfaceElementsJSON): Template {
  return { name, type: 'template', preview, content: makeTemplateSnapshot(elements, name) };
}

export const otherTemplateCategory: TemplateCategory = {
  name: 'Other',
  templates: [
    t('SWOT', previews.swot, swot()),
    t('Kanban board', previews.kanban, kanban()),
    t('Business model canvas', previews.bmc, bmc()),
    t('Fishbone (Ishikawa)', previews.fishbone, fishbone()),
    t('Gantt chart', previews.gantt, gantt()),
  ],
};
