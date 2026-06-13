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
} from '@labre/affine-model';

import {
  END_WIDTH,
  EVENT_END,
  EVENT_START,
  INNER_FONT_SIZE,
  NEUTRAL_STROKE,
  NODE_FILL,
  NODE_SIZE,
  NODE_STROKE_WIDTH,
  SEQUENCE_STROKE,
  SEQUENCE_WIDTH,
  START_WIDTH,
  TASK_RADIUS,
} from '../consts';

type NodeKind = 'startEvent' | 'endEvent' | 'task' | 'gatewayExclusive';

/** One BPMN flow-object node, as a surface-element JSON entry. */
function node(kind: NodeKind, x: number, y: number, text?: string) {
  const { w, h } = NODE_SIZE[kind];
  const base: Record<string, unknown> = {
    type: 'bpmnNode',
    kind,
    filled: true,
    fillColor: NODE_FILL,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    xywh: `[${x},${y},${w},${h}]`,
  };
  if (kind === 'startEvent')
    return { ...base, shapeType: 'ellipse', strokeColor: EVENT_START, strokeWidth: START_WIDTH };
  if (kind === 'endEvent')
    return { ...base, shapeType: 'ellipse', strokeColor: EVENT_END, strokeWidth: END_WIDTH };
  if (kind === 'gatewayExclusive')
    return { ...base, shapeType: 'diamond', strokeColor: NEUTRAL_STROKE, strokeWidth: NODE_STROKE_WIDTH };
  return {
    ...base,
    shapeType: 'rect',
    radius: TASK_RADIUS,
    strokeColor: NEUTRAL_STROKE,
    strokeWidth: NODE_STROKE_WIDTH,
    text: surfaceText(text ?? 'Task'),
    color: NEUTRAL_STROKE,
    fontFamily: FontFamily.Inter,
    fontSize: INNER_FONT_SIZE,
    textAlign: 'center',
  };
}

function pool(x: number, y: number, w: number, h: number, name = 'Pool') {
  return { type: 'bpmnPool', name, xywh: `[${x},${y},${w},${h}]` };
}

/** A sequence-flow connector; ids are remapped on insert. */
function seq(source: string, target: string) {
  return {
    type: 'connector',
    mode: ConnectorMode.Orthogonal,
    stroke: SEQUENCE_STROKE,
    strokeWidth: SEQUENCE_WIDTH,
    strokeStyle: StrokeStyle.Solid,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: PointStyle.Triangle,
    source: { id: source, position: [0.5, 0.5] },
    target: { id: target, position: [0.5, 0.5] },
  };
}

/** A standalone (free) sequence-flow arrow for the prefab card. */
function freeSeq(): Record<string, unknown> {
  return {
    type: 'connector',
    mode: ConnectorMode.Orthogonal,
    stroke: SEQUENCE_STROKE,
    strokeWidth: SEQUENCE_WIDTH,
    strokeStyle: StrokeStyle.Solid,
    frontEndpointStyle: PointStyle.None,
    rearEndpointStyle: PointStyle.Triangle,
    source: { position: [0, 0] },
    target: { position: [140, 0] },
  };
}

const single = (el: Record<string, unknown>): SurfaceElementsJSON => ({ a: el });

const PREVIEW_ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';

const previews = {
  process: `<svg ${PREVIEW_ATTRS} fill="none"><circle cx="16" cy="40" r="8" stroke="#43a06b" stroke-width="2"/><rect x="34" y="31" width="26" height="18" rx="3" stroke="#262626" stroke-width="1.6"/><path d="M78 31 L88 40 L78 49 L68 40 Z" stroke="#262626" stroke-width="1.4"/><path d="M73 37 L83 43 M83 37 L73 43" stroke="#262626" stroke-width="1.2"/><circle cx="118" cy="40" r="8" stroke="#cf5648" stroke-width="3"/><path d="M24 40 H34 M60 40 H68 M88 40 H110" stroke="#262626" stroke-width="1.2"/></svg>`,
  startEvent: `<svg ${PREVIEW_ATTRS} fill="none"><circle cx="67" cy="40" r="20" stroke="#43a06b" stroke-width="3"/></svg>`,
  endEvent: `<svg ${PREVIEW_ATTRS} fill="none"><circle cx="67" cy="40" r="20" stroke="#cf5648" stroke-width="5"/></svg>`,
  task: `<svg ${PREVIEW_ATTRS} fill="none"><rect x="34" y="24" width="66" height="32" rx="6" stroke="#262626" stroke-width="2.4"/></svg>`,
  gateway: `<svg ${PREVIEW_ATTRS} fill="none"><path d="M67 16 L92 40 L67 64 L42 40 Z" stroke="#262626" stroke-width="2.4" stroke-linejoin="round"/><path d="M58 31 L76 49 M76 31 L58 49" stroke="#262626" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  sequence: `<svg ${PREVIEW_ATTRS} fill="none"><path d="M24 40 H96" stroke="#262626" stroke-width="2.4" stroke-linecap="round"/><path d="M94 33 L108 40 L94 47 Z" fill="#262626"/></svg>`,
  pool: `<svg ${PREVIEW_ATTRS} fill="none"><rect x="14" y="20" width="107" height="40" rx="3" stroke="#262626" stroke-width="2"/><path d="M30 20 V60" stroke="#262626" stroke-width="1.8"/><rect x="14" y="20" width="16" height="40" fill="#f4f4f5"/><path d="M30 20 V60" stroke="#262626" stroke-width="1.8"/></svg>`,
};

/** The lean BPMN basics: a simple worked process + every prefab the menu makes. */
function bpmnTemplates(): Template[] {
  const process: SurfaceElementsJSON = {
    pool: pool(0, 0, 640, 200, 'Process'),
    start: node('startEvent', 40, 72),
    task1: node('task', 116, 64, 'Submit request'),
    gw: node('gatewayExclusive', 272, 64),
    task2: node('task', 376, 20, 'Fulfil'),
    task3: node('task', 376, 124, 'Reject'),
    end: node('endEvent', 556, 72),
    c1: seq('start', 'task1'),
    c2: seq('task1', 'gw'),
    c3: seq('gw', 'task2'),
    c4: seq('gw', 'task3'),
    c5: seq('task2', 'end'),
    c6: seq('task3', 'end'),
  };

  const t = (
    name: string,
    preview: string,
    elements: SurfaceElementsJSON
  ): Template => ({
    name,
    type: 'template',
    preview,
    content: makeTemplateSnapshot(elements, name),
  });

  return [
    t('Simple process', previews.process, process),
    t('Start event', previews.startEvent, single(node('startEvent', 0, 0))),
    t('End event', previews.endEvent, single(node('endEvent', 0, 0))),
    t('Task', previews.task, single(node('task', 0, 0))),
    t('Exclusive gateway', previews.gateway, single(node('gatewayExclusive', 0, 0))),
    t('Sequence flow', previews.sequence, single(freeSeq())),
    t('Pool', previews.pool, single(pool(0, 0, 560, 200))),
  ];
}

export const bpmnTemplateCategory: TemplateCategory = {
  name: 'BPMN',
  templates: bpmnTemplates(),
};
