export type ElementDragEvent = {
  el: HTMLElement;
  inputType: 'mouse' | 'touch';
  originalEvent: MouseEvent | TouchEvent;
  x: number;
  y: number;
};

export const touchResolver = (event: TouchEvent) =>
  ({
    el: event.currentTarget as HTMLElement,
    inputType: 'touch',
    originalEvent: event,
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  }) satisfies ElementDragEvent;

export const mouseResolver = (event: MouseEvent) =>
  ({
    el: event.currentTarget as HTMLElement,
    inputType: 'mouse',
    originalEvent: event,
    x: event.clientX,
    y: event.clientY,
  }) satisfies ElementDragEvent;
