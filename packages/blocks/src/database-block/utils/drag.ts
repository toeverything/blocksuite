export const startDrag = <
  T extends Record<string, unknown> | void,
  P = { x: number }
>(
  evt: PointerEvent,
  ops: {
    transform?: (evt: PointerEvent) => P;
    onDrag: (p: P) => T;
    onMove: (p: P) => T;
    onDrop: (result: T) => void;
  }
) => {
  const transform = ops?.transform ?? (e => e as P);
  const result = {
    data: ops.onDrag(transform(evt)),
    move: (p: P) => {
      result.data = ops.onMove(p);
    },
  };
  const move = (evt: PointerEvent) => {
    result.data = ops.onMove(transform(evt));
  };
  const up = () => {
    try {
      ops.onDrop(result.data);
    } finally {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    }
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);

  return result;
};
