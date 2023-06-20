export const startDrag = <
  T extends Record<string, unknown> | void,
  P = { x: number }
>(
  evt: MouseEvent,
  ops: {
    transform?: (evt: MouseEvent) => P;
    onDrag: (p: P) => T;
    onMove: (p: P) => T;
    onDrop: (result: T) => void;
  }
) => {
  const transform = ops?.transform ?? (e => ({ x: e.x } as P));
  const result = {
    data: ops.onDrag(transform(evt)),
    move: (p: P) => {
      result.data = ops.onMove(p);
    },
  };
  const move = (evt: MouseEvent) => {
    result.data = ops.onMove(transform(evt));
  };
  const up = () => {
    try {
      ops.onDrop(result.data);
    } finally {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    }
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);

  return result;
};
