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
  type WardleyBgVariant,
} from '@labre/affine-model';

import { REF_WIDTH } from '../consts';
import { wardleyMaps } from './maps';
import {
  ECOSYSTEM_SIZE,
  HANDLE_SIZE,
  INERTIA_COLOR,
  INERTIA_SIZE,
  LABEL_FONT_SIZE,
  LINK_GREY,
  LINK_STROKE_WIDTH,
  MARKET_DOT_RING,
  MARKET_DOT_SIZE,
  MARKET_DOT_STROKE_WIDTH,
  MARKET_LINK_COLOR,
  MARKET_LINK_WIDTH,
  MARKET_SIZE,
  METHOD_FILL,
  METHOD_SIZE,
  NODE_FILL,
  NODE_SIZE,
  NODE_STROKE,
  NODE_STROKE_WIDTH,
  PIPELINE_FILL,
  PIPELINE_HEIGHT,
  PIPELINE_WIDTH,
  WARDLEY_RED,
} from '../node/consts';

const VARIANT_DEFAULTS: Record<WardleyBgVariant, Record<string, unknown>> = {
  classic: {},
  opportunity: {
    yAxisTitle: 'Opportunity',
    showVisibilityLabels: false,
    showCornerLabels: false,
  },
  benefit: {
    yAxisTitle: '',
    visibilityHigh: 'Benefit',
    visibilityLow: 'Investment',
    showCornerLabels: false,
  },
  'evolution-gradient': {},
};

const bg = (variant: WardleyBgVariant, w = REF_WIDTH) => {
  const h = Math.round((w * 9) / 16);
  return { type: 'wardley', variant, ...VARIANT_DEFAULTS[variant], xywh: `[0,0,${w},${h}]` };
};

/** A wardley node ellipse positioned by top-left. */
function node(
  kind: string,
  x: number,
  y: number,
  d = NODE_SIZE,
  fill = NODE_FILL,
  strokeWidth = NODE_STROKE_WIDTH
) {
  return {
    type: 'wardleyNode',
    kind,
    shapeType: 'ellipse',
    filled: true,
    fillColor: fill,
    strokeColor: NODE_STROKE,
    strokeWidth,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    xywh: `[${x},${y},${d},${d}]`,
  };
}

function label(x: number, y: number, str: string, align: 'left' | 'center' = 'left') {
  return {
    type: 'text',
    text: surfaceText(str),
    color: NODE_STROKE,
    fontFamily: FontFamily.Inter,
    fontSize: LABEL_FONT_SIZE,
    textAlign: align === 'center' ? TextAlign.Center : TextAlign.Left,
    xywh: `[${x},${y},140,26]`,
  };
}

function connect(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  opts: { red?: boolean } = {}
) {
  return {
    type: 'connector',
    mode: ConnectorMode.Straight,
    stroke: opts.red ? WARDLEY_RED : LINK_GREY,
    strokeStyle: opts.red ? StrokeStyle.Dash : StrokeStyle.Solid,
    strokeWidth: LINK_STROKE_WIDTH,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: opts.red ? PointStyle.Triangle : PointStyle.None,
    source,
    target,
  };
}

const inertia = (x = 0, y = 0) => ({
  type: 'shape',
  shapeType: 'rect',
  filled: true,
  fillColor: INERTIA_COLOR,
  strokeColor: INERTIA_COLOR,
  strokeWidth: 0,
  shapeStyle: ShapeStyle.General,
  roughness: 0,
  radius: 0,
  xywh: `[${x},${y},${INERTIA_SIZE.w},${INERTIA_SIZE.h}]`,
});

/** Pipeline composite: body rect + handle square (straddling top) + label. */
function pipeline(): SurfaceElementsJSON {
  return {
    label: label(0, 0, 'Pipeline', 'center'),
    body: {
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
      xywh: `[0,39,${PIPELINE_WIDTH},${PIPELINE_HEIGHT}]`,
    },
    handle: {
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
      xywh: `[${PIPELINE_WIDTH / 2 - HANDLE_SIZE / 2},${39 - HANDLE_SIZE / 2},${HANDLE_SIZE},${HANDLE_SIZE}]`,
    },
  };
}

/** Market composite: outer circle + 3 inner dots wired in a triangle + label. */
function market(): SurfaceElementsJSON {
  const R = MARKET_SIZE / 2;
  const c = R; // center within the [0,0,MARKET_SIZE,MARKET_SIZE] box
  const rho = MARKET_DOT_RING;
  const sin60 = Math.sqrt(3) / 2;
  const verts = [
    [0, -rho],
    [rho * sin60, rho / 2],
    [-rho * sin60, rho / 2],
  ];
  const dotAt = (vx: number, vy: number) =>
    node('component', c + vx - MARKET_DOT_SIZE / 2, c + vy - MARKET_DOT_SIZE / 2, MARKET_DOT_SIZE, NODE_FILL, MARKET_DOT_STROKE_WIDTH);
  const tri = (a: string, b: string) => ({
    type: 'connector',
    mode: ConnectorMode.Straight,
    stroke: MARKET_LINK_COLOR,
    strokeStyle: StrokeStyle.Solid,
    strokeWidth: MARKET_LINK_WIDTH,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: PointStyle.None,
    source: { id: a },
    target: { id: b },
  });
  return {
    circle: node('market', 0, 0, MARKET_SIZE, NODE_FILL),
    d0: dotAt(verts[0][0], verts[0][1]),
    d1: dotAt(verts[1][0], verts[1][1]),
    d2: dotAt(verts[2][0], verts[2][1]),
    t0: tri('d0', 'd1'),
    t1: tri('d1', 'd2'),
    t2: tri('d2', 'd0'),
    label: label(MARKET_SIZE + 8, 2, 'Market'),
  };
}

const single = (el: Record<string, unknown>): SurfaceElementsJSON => ({ a: el });
const nodeWithLabel = (kind: string, d: number, fill: string, name: string): SurfaceElementsJSON => ({
  n: node(kind, 0, 0, d, fill),
  l: label(d + 8, d / 2 - 13, name),
});

const ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';
const bgPreview = (extra = '') =>
  `<svg ${ATTRS} fill="none"><path d="M22 12 V64 H120" stroke="#3b3d42" stroke-width="2"/><path d="M44 12 V64 M68 12 V64 M94 12 V64" stroke="#9aa0a6" stroke-width="0.8"/>${extra}</svg>`;
const dotPreview = (fill: string, sw = 2) =>
  `<svg ${ATTRS} fill="none"><circle cx="67" cy="40" r="13" fill="${fill}" stroke="#1f2328" stroke-width="${sw}"/></svg>`;

function tpl(name: string, preview: string, elements: SurfaceElementsJSON): Template {
  return { name, type: 'template', preview, content: makeTemplateSnapshot(elements, name) };
}

export const wardleyTemplateCategory: TemplateCategory = {
  name: 'Wardley',
  templates: [
    ...wardleyMaps,
    tpl('Map background', bgPreview(), { bg: bg('classic') }),
    tpl('Opportunity gradient', bgPreview('<rect x="22" y="12" width="98" height="52" fill="#eef4fb" opacity="0.6"/>'), { bg: bg('opportunity') }),
    tpl('Benefit gradient', bgPreview('<rect x="22" y="12" width="98" height="26" fill="#e6eef8" opacity="0.6"/>'), { bg: bg('benefit') }),
    tpl('Evolution gradient', bgPreview('<rect x="22" y="12" width="98" height="52" fill="#e3e2e4" opacity="0.5"/>'), { bg: bg('evolution-gradient') }),
    tpl('Component', dotPreview('#ffffff', 1.5), nodeWithLabel('component', NODE_SIZE, NODE_FILL, 'Component')),
    tpl('Anchor', `<svg ${ATTRS} fill="none"><circle cx="67" cy="40" r="13" fill="#fff" stroke="#1f2328" stroke-width="1.5"/><circle cx="67" cy="36" r="3.5" fill="#1f2328"/><path d="M59 48 q8 -9 16 0" stroke="#1f2328" stroke-width="1.5" fill="none"/></svg>`, nodeWithLabel('anchor', NODE_SIZE, NODE_FILL, 'Anchor')),
    tpl('Ecosystem', `<svg ${ATTRS} fill="none"><circle cx="67" cy="40" r="15" fill="#fff" stroke="#1f2328" stroke-width="1.5"/><circle cx="67" cy="40" r="11" fill="none" stroke="#1f2328"/><circle cx="67" cy="40" r="5" fill="#fff" stroke="#1f2328"/></svg>`, nodeWithLabel('ecosystem', ECOSYSTEM_SIZE, NODE_FILL, 'Ecosystem')),
    tpl('Method', `<svg ${ATTRS} fill="none"><circle cx="67" cy="40" r="15" fill="#d9d9d9" stroke="#1f2328" stroke-width="1.5"/><circle cx="67" cy="40" r="7" fill="#fff" stroke="#1f2328"/></svg>`, nodeWithLabel('method', METHOD_SIZE, METHOD_FILL, 'Component')),
    tpl('Pipeline', `<svg ${ATTRS} fill="none"><rect x="34" y="40" width="66" height="14" fill="#fff" stroke="#1f2328"/><rect x="60" y="33" width="14" height="14" fill="#fff" stroke="#1f2328"/></svg>`, pipeline()),
    tpl('Market', `<svg ${ATTRS} fill="none"><circle cx="67" cy="40" r="16" fill="#fff" stroke="#1f2328"/><circle cx="67" cy="30" r="3.5" fill="#fff" stroke="#1f2328" stroke-width="1.5"/><circle cx="75" cy="46" r="3.5" fill="#fff" stroke="#1f2328" stroke-width="1.5"/><circle cx="59" cy="46" r="3.5" fill="#fff" stroke="#1f2328" stroke-width="1.5"/><path d="M67 30 L75 46 L59 46 Z" stroke="#1f2328" stroke-width="0.8" fill="none"/></svg>`, market()),
    tpl('Inertia', `<svg ${ATTRS} fill="none"><rect x="63" y="22" width="8" height="36" fill="#1f2328"/></svg>`, single(inertia())),
    tpl('Link', `<svg ${ATTRS} fill="none"><path d="M24 40 H110" stroke="#666" stroke-width="2.4"/></svg>`, single(connect({ position: [0, 0] }, { position: [160, 0] }))),
    tpl('Evolution arrow', `<svg ${ATTRS} fill="none"><path d="M24 40 H100" stroke="#d6455d" stroke-width="2.4" stroke-dasharray="6 4"/><path d="M98 33 L112 40 L98 47 Z" fill="#d6455d"/></svg>`, single(connect({ position: [0, 0] }, { position: [160, 0] }, { red: true }))),
  ],
};
