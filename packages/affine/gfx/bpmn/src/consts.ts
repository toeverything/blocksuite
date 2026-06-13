import type { BpmnNodeKind } from '@labre/affine-model';

/**
 * Visual constants for the BPMN basics. Style "C" (hybrid): spec-accurate
 * shapes and line weights, with accent colour only on the event rings — the
 * task and gateway stay neutral. All of these are just the creation-time
 * defaults; every value is an editable shape property afterwards.
 */

/** Accent stroke for the start event (thin green ring). */
export const EVENT_START = '#43a06b';
/** Accent stroke for the end event (thick red ring). */
export const EVENT_END = '#cf5648';
/** Neutral stroke for task / gateway (matches the EDGY base shapes). */
export const NEUTRAL_STROKE = '#262626';
/** Default fill for events / task / gateway. */
export const NODE_FILL = '#ffffff';

/** BPMN line weights: thin start ring, thick end ring, regular elsewhere. */
export const START_WIDTH = 2;
export const END_WIDTH = 4;
export const NODE_STROKE_WIDTH = 2;

/** Task corner radius (absolute px — a lightly rounded rectangle). */
export const TASK_RADIUS = 10;

/** Inner-text font for the task label. */
export const INNER_FONT_SIZE = 18;

/** Default node sizes (model units) per kind. */
export const NODE_SIZE: Record<BpmnNodeKind, { w: number; h: number }> = {
  startEvent: { w: 56, h: 56 },
  endEvent: { w: 56, h: 56 },
  task: { w: 120, h: 72 },
  gatewayExclusive: { w: 72, h: 72 },
};

/** Default inner text per kind (only the task carries a label). */
export const NODE_LABEL: Record<BpmnNodeKind, string> = {
  startEvent: '',
  endEvent: '',
  task: 'Task',
  gatewayExclusive: '',
};

/** Pool (background container) defaults. */
export const POOL_BAND_WIDTH = 28;
export const POOL_FRAME_COLOR = '#262626';
export const POOL_BAND_FILL = '#f4f4f5';
export const POOL_FRAME_WIDTH = 1.5;
export const POOL_NAME_FONT_SIZE = 15;
export const POOL_NAME_COLOR = '#262626';
export const POOL_FONT_FAMILY = 'Inter, sans-serif';

/** Sequence-flow connector preset. */
export const SEQUENCE_STROKE = '#262626';
export const SEQUENCE_WIDTH = 2;
