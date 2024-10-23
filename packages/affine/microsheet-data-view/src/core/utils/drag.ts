export const startDrag = <
  T extends Record<string, unknown> | void,
  P = {
    x: number;
  },
>(
  evt: MouseEvent,
  ops: {
    transform?: (evt: MouseEvent) => P;
    onDrag: (p: P) => T;
    onMove: (p: P) => T;
    onDrop: (result: T) => void;
    onClear: () => void;
  }
) => {
  const transform = ops?.transform ?? (e => e as P);
  const param = transform(evt);
  const result = {
    data: ops.onDrag(param),
    last: param,
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
    const p = transform(evt);
    result.last = p;
    result.data = ops.onMove(p);
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
