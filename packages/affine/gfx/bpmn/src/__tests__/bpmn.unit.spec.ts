import { describe, expect, it, vi } from 'vitest';

import {
  EVENT_END,
  EVENT_START,
  END_WIDTH,
  NEUTRAL_STROKE,
  NODE_LABEL,
  NODE_SIZE,
  START_WIDTH,
} from '../consts';
import { bpmnPool } from '../element-renderer';

// The pool renderer only reads (model, ctx, matrix); cast to call with those.
const renderPool = bpmnPool as unknown as (
  model: unknown,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix
) => void;

describe('bpmn style-C constants', () => {
  it('defines a size and label for every node kind', () => {
    const kinds = ['startEvent', 'endEvent', 'task', 'gatewayExclusive'] as const;
    for (const kind of kinds) {
      expect(NODE_SIZE[kind].w).toBeGreaterThan(0);
      expect(NODE_SIZE[kind].h).toBeGreaterThan(0);
      expect(typeof NODE_LABEL[kind]).toBe('string');
    }
  });

  it('only the task carries an inner label', () => {
    expect(NODE_LABEL.task).toBe('Task');
    expect(NODE_LABEL.startEvent).toBe('');
    expect(NODE_LABEL.endEvent).toBe('');
    expect(NODE_LABEL.gatewayExclusive).toBe('');
  });

  it('accents events only: green thin start, red thick end, neutral task/gateway', () => {
    expect(EVENT_START).toMatch(/^#/);
    expect(EVENT_END).toMatch(/^#/);
    expect(EVENT_START).not.toBe(EVENT_END);
    // End ring is heavier than the start ring (BPMN line weights).
    expect(END_WIDTH).toBeGreaterThan(START_WIDTH);
    expect(NEUTRAL_STROKE).toBe('#262626');
  });
});

/** Minimal canvas-context stub recording only what the pool renderer touches. */
function fakeCtx() {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineJoin: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
  };
  return ctx as unknown as CanvasRenderingContext2D & { fillText: ReturnType<typeof vi.fn> };
}

/** Chainable identity matrix stub (the renderer only calls *Self mutators). */
function fakeMatrix() {
  const m = {
    translateSelf: () => m,
    rotateSelf: () => m,
  };
  return m as unknown as DOMMatrix;
}

function poolModel(name: string, w = 560, h = 200) {
  return { deserializedXYWH: [0, 0, w, h], rotate: 0, name } as never;
}

describe('bpmn pool renderer', () => {
  it('draws the frame and the participant name when present', () => {
    const ctx = fakeCtx();
    renderPool(poolModel('Customer'), ctx, fakeMatrix());
    expect(ctx.fillRect).toHaveBeenCalled(); // name band
    expect(ctx.stroke).toHaveBeenCalled(); // frame + divider
    expect(ctx.fillText).toHaveBeenCalledWith('Customer', 0, 0);
  });

  it('skips the name when empty', () => {
    const ctx = fakeCtx();
    renderPool(poolModel(''), ctx, fakeMatrix());
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('skips the name when the pool is too narrow for the band', () => {
    const ctx = fakeCtx();
    renderPool(poolModel('Customer', 8), ctx, fakeMatrix());
    expect(ctx.fillText).not.toHaveBeenCalled();
  });
});
