export interface IPoint {
  x: number;
  y: number;
}

export interface Bound {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SelectionEvent extends IPoint {
  start: IPoint;
  delta: IPoint;
  raw: MouseEvent;
  containerOffset: IPoint;
  keys: {
    shift: boolean;
    /** command or control */
    cmd: boolean;
    alt: boolean;
  };
  button?: number;
}

function isFarEnough(a: IPoint, b: IPoint, d = 2) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
}

function toSelectionEvent(
  e: MouseEvent,
  rect: DOMRect,
  startX: number,
  startY: number,
  last: SelectionEvent | null = null
): SelectionEvent {
  const delta = { x: 0, y: 0 };
  const start = { x: startX, y: startY };
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  const selectionEvent: SelectionEvent = {
    x: offsetX,
    y: offsetY,
    raw: e,
    // absolute position is still **relative** to the nearest positioned ancestor.
    //  In our case, it is the editor. For example, if there is padding/margin in editor,
    //    then the correct absolute `x`/`y` of mouse position is `containerOffset.x - x`
    // Refs: https://developer.mozilla.org/en-US/docs/Web/CSS/position#absolute_positioning
    containerOffset: {
      x: rect.left,
      y: rect.top,
    },
    delta,
    start,
    keys: {
      shift: e.shiftKey,
      cmd: e.metaKey || e.ctrlKey,
      alt: e.altKey,
    },
    button: e.button,
  };
  if (last) {
    delta.x = offsetX - last.x;
    delta.y = offsetY - last.y;
  }
  return selectionEvent;
}

export function isPageTitle(e: Event) {
  return (
    e.target instanceof HTMLInputElement &&
    e.target.classList.contains('affine-default-page-block-title')
  );
}
export function isInput(e: Event) {
  return e.target instanceof HTMLInputElement;
}

function tryPreventDefault(e: MouseEvent) {
  // workaround page title click
  if (!isInput(e)) {
    e.preventDefault();
  }
}

export function initMouseEventHandlers(
  container: HTMLElement,
  onContainerDragStart: (e: SelectionEvent) => void,
  onContainerDragMove: (e: SelectionEvent) => void,
  onContainerDragEnd: (e: SelectionEvent) => void,
  onContainerClick: (e: SelectionEvent) => void,
  onContainerDblClick: (e: SelectionEvent) => void,
  onContainerMouseMove: (e: SelectionEvent) => void,
  onContainerMouseOut: (e: SelectionEvent) => void,
  onContainerContextMenu: (e: SelectionEvent) => void,
  onContainerScroll: (e: Event) => void,
  onContainerResize: (e: UIEvent) => void
) {
  let startX = -Infinity;
  let startY = -Infinity;
  let isDragging = false;
  let last: SelectionEvent | null = null;
  const rect: DOMRect = container.getBoundingClientRect();

  const scrollHandler = (e: Event) => {
    onContainerScroll(e);
  };

  const resizeHandler = (e: UIEvent) => {
    onContainerResize(e);
  };

  const mouseOutHandler = (e: MouseEvent) =>
    onContainerMouseOut(toSelectionEvent(e, rect, startX, startY));

  const mouseDownHandler = (e: MouseEvent) => {
    tryPreventDefault(e);

    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = false;
    // e.button is 0 means left button
    if (!e.button) {
      last = toSelectionEvent(e, rect, startX, startY);
    }
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mouseout', mouseOutHandler);
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    tryPreventDefault(e);

    const a = { x: startX, y: startY };
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const b = { x: offsetX, y: offsetY };

    if (!last) {
      onContainerMouseMove(toSelectionEvent(e, rect, startX, startY, last));
      return;
    }

    if (isFarEnough(a, b) && !isDragging) {
      isDragging = true;
      onContainerDragStart(last);
    }

    if (isDragging) {
      onContainerDragMove(toSelectionEvent(e, rect, startX, startY, last));
      onContainerMouseMove(toSelectionEvent(e, rect, startX, startY, last));
      last = toSelectionEvent(e, rect, startX, startY);
    }
  };

  const mouseUpHandler = (e: MouseEvent) => {
    tryPreventDefault(e);

    if (!isDragging)
      onContainerClick(toSelectionEvent(e, rect, startX, startY));
    else onContainerDragEnd(toSelectionEvent(e, rect, startX, startY, last));

    startX = startY = -Infinity;
    isDragging = false;
    last = null;

    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('mouseout', mouseOutHandler);
  };

  const contextMenuHandler = (e: MouseEvent) => {
    // e.preventDefault();
    // e.stopPropagation();
    onContainerContextMenu(toSelectionEvent(e, rect, startX, startY));
  };

  const dblClickHandler = (e: MouseEvent) => {
    onContainerDblClick(toSelectionEvent(e, rect, startX, startY));
  };

  container.addEventListener('mousedown', mouseDownHandler);
  container.addEventListener('mousemove', mouseMoveHandler);
  container.addEventListener('contextmenu', contextMenuHandler);
  container.addEventListener('dblclick', dblClickHandler);
  container.addEventListener('scroll', scrollHandler);
  container.addEventListener('resize', resizeHandler);

  const dispose = () => {
    container.removeEventListener('mousedown', mouseDownHandler);
    container.removeEventListener('mousemove', mouseMoveHandler);
    container.removeEventListener('contextmenu', contextMenuHandler);
    container.removeEventListener('dblclick', dblClickHandler);
    container.removeEventListener('scroll', scrollHandler);
  };
  return dispose;
}
