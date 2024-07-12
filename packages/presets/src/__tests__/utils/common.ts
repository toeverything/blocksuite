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
      bubbles: true,
      clientX,
      clientY,
    })
  );
  target.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      clientX,
      clientY,
    })
  );
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      clientX,
      clientY,
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
  position: { x: number; y: number }
) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      clientX,
      clientY,
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
  position: { x: number; y: number }
) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      clientX,
      clientY,
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
  position: { x: number; y: number }
) {
  const element = target.getBoundingClientRect();
  const clientX = element.x + position.x;
  const clientY = element.y + position.y;

  target.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX,
      clientY,
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
