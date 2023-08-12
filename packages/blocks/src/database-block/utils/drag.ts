export const startDrag = <
  T extends Record<string, unknown> | void,
  P = {
    x: number;
  }
>(
  evt: PointerEvent,
  ops: {
    transform?: (evt: PointerEvent) => P;
    onDrag: (p: P) => T;
    onMove: (p: P) => T;
    onDrop: (result: T) => void;
    onClear: () => void;
  }
) => {
  const transform = ops?.transform ?? (e => e as P);
  const result = {
    data: ops.onDrag(transform(evt)),
    move: (p: P) => {
      result.data = ops.onMove(p);
    },
  };
  const clear = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('keydown', keydown);
    ops.onClear();
  };
  const keydown = (evt: KeyboardEvent) => {
    if (evt.key === 'Escape') {
      clear();
    }
  };
  const move = (evt: PointerEvent) => {
    evt.preventDefault();
    result.data = ops.onMove(transform(evt));
  };
  const up = () => {
    try {
      ops.onDrop(result.data);
    } finally {
      clear();
    }
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('keydown', keydown);

  return result;
};
