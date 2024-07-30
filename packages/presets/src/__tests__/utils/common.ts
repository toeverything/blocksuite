export function wait(time: number = 0) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, time);
    });
  });
}

/**
 * simulate click event
 * @param target
 * @param position position relative to the target
 */
export function click(target: HTMLElement, position: { x: number; y: number }) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      clientX,
      clientY,
      bubbles: true,
      pointerId: 1,
      isPrimary: true,
    })
  );
  target.dispatchEvent(
    new PointerEvent('pointerup', {
      clientX,
      clientY,
      bubbles: true,
      pointerId: 1,
      isPrimary: true,
    })
  );
  target.dispatchEvent(
    new MouseEvent('click', {
      clientX,
      clientY,
      bubbles: true,
    })
  );
}

/**
 * simulate pointerdown event
 * @param target
 * @param position position relative to the target
 */
export function pointerdown(
  target: HTMLElement,
  position: { x: number; y: number },
  isPrimary = true
) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      clientX,
      clientY,
      bubbles: true,
      pointerId: isPrimary ? 1 : 2,
      isPrimary,
    })
  );
}

/**
 * simulate pointerup event
 * @param target
 * @param position position relative to the target
 */
export function pointerup(
  target: HTMLElement,
  position: { x: number; y: number },
  isPrimary = true
) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointerup', {
      clientX,
      clientY,
      bubbles: true,
      pointerId: isPrimary ? 1 : 2,
      isPrimary,
    })
  );
}

/**
 * simulate pointermove event
 * @param target
 * @param position position relative to the target
 */
export function pointermove(
  target: HTMLElement,
  position: { x: number; y: number },
  isPrimary = true
) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX,
      clientY,
      bubbles: true,
      pointerId: isPrimary ? 1 : 2,
      isPrimary,
    })
  );
}

export function drag(
  target: HTMLElement,
  start: { x: number; y: number },
  end: { x: number; y: number },
  step: number = 5
) {
  pointerdown(target, start);
  pointermove(target, start);

  if (step !== 0) {
    const xStep = (end.x - start.x) / step;
    const yStep = (end.y - start.y) / step;

    for (const [i] of Array.from({ length: step }).entries()) {
      pointermove(target, {
        x: start.x + xStep * (i + 1),
        y: start.y + yStep * (i + 1),
      });
    }
  }

  pointermove(target, end);
  pointerup(target, end);
}

/**
 * simulate pinch event, position relative to the target
 * @param target
 * @param start1 start position of the first finger
 * @param start2 start position of the second finger
 * @param end1 end position of the first finger
 * @param end2 end position of the second finger
 */
export function pinch(
  target: Element,
  start1: { x: number; y: number },
  start2: { x: number; y: number },
  end1: { x: number; y: number },
  end2: { x: number; y: number },
  step: number = 5
) {
  pointerdown(target as HTMLElement, start1, true);
  pointerdown(target as HTMLElement, start2, false);
  pointermove(target as HTMLElement, start1, true);
  pointermove(target as HTMLElement, start2, false);

  if (step !== 0) {
    const xStep1 = (end1.x - start1.x) / step;
    const yStep1 = (end1.y - start1.y) / step;
    const xStep2 = (end2.x - start2.x) / step;
    const yStep2 = (end2.y - start2.y) / step;

    for (const [i] of Array.from({ length: step }).entries()) {
      pointermove(
        target as HTMLElement,
        {
          x: start1.x + xStep1 * (i + 1),
          y: start1.y + yStep1 * (i + 1),
        },
        true
      );
      pointermove(
        target as HTMLElement,
        {
          x: start2.x + xStep2 * (i + 1),
          y: start2.y + yStep2 * (i + 1),
        },
        false
      );
    }
  }

  pointermove(target as HTMLElement, end1, true);
  pointermove(target as HTMLElement, end2, false);
  pointerup(target as HTMLElement, end1, true);
  pointerup(target as HTMLElement, end2, false);
}
