import type { IPoint } from '@blocksuite/shared';
import { GroupBlockModel } from '../../group-block';
import { ViewportState, IEdgelessContainer, XYWH } from './edgeless-page-block';

interface EdgelessSelectionEvent extends IPoint {
  start: IPoint;
  delta: IPoint;
  raw: MouseEvent;
  keys: {
    shift: boolean;
    /** command or control */
    cmd: boolean;
    alt: boolean;
  };
}

function isFarEnough(a: IPoint, b: IPoint, d = 2) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
}

function isPointIn(block: { xywh: string }, x: number, y: number): boolean {
  const a = JSON.parse(block.xywh) as [number, number, number, number];
  const [ax, ay, aw, ah] = a;
  return ax < x && x <= ax + aw && ay < y && y <= ay + ah;
}

function pick(
  blocks: GroupBlockModel[],
  modelX: number,
  modelY: number
): GroupBlockModel | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (isPointIn(blocks[i], modelX, modelY)) {
      return blocks[i];
    }
  }
  return null;
}

function toModelCoord(
  viewport: ViewportState,
  viewX: number,
  viewY: number
): [number, number] {
  const { viewportX, viewportY, zoom } = viewport;
  return [viewportX + viewX / zoom, viewportY + viewY / zoom];
}

function toViewCoord(
  viewport: ViewportState,
  modelX: number,
  modelY: number
): [number, number] {
  const { viewportX, viewportY, zoom } = viewport;
  return [(modelX - viewportX) * zoom, (modelY - viewportY) * zoom];
}

function getSelectionBoxBound(viewport: ViewportState, xywh: string) {
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const [x, y] = toViewCoord(viewport, modelX, modelY);
  return {
    x,
    y,
    w: modelW * viewport.zoom,
    h: modelH * viewport.zoom,
  };
}

function toSelectionEvent(
  e: MouseEvent,
  rect: DOMRect | null,
  startX: number,
  startY: number,
  last: EdgelessSelectionEvent | null = null
): EdgelessSelectionEvent {
  const delta = { x: 0, y: 0 };
  const start = { x: startX, y: startY };
  const offsetX = e.clientX - (rect?.left ?? 0);
  const offsetY = e.clientY - (rect?.top ?? 0);
  const selectionEvent: EdgelessSelectionEvent = {
    x: offsetX,
    y: offsetY,
    raw: e,
    delta,
    start,
    keys: {
      shift: e.shiftKey,
      cmd: e.metaKey || e.ctrlKey,
      alt: e.altKey,
    },
  };
  if (last) {
    delta.x = offsetX - last.x;
    delta.y = offsetY - last.y;
  }
  return selectionEvent;
}

export function initDomEventHandlers(
  container: HTMLElement,
  onContainerDragStart: (e: EdgelessSelectionEvent) => void,
  onContainerDragMove: (e: EdgelessSelectionEvent) => void,
  onContainerDragEnd: (e: EdgelessSelectionEvent) => void,
  onContainerClick: (e: EdgelessSelectionEvent) => void,
  onContainerDblClick: (e: EdgelessSelectionEvent) => void,
  onContainerMouseMove: (e: EdgelessSelectionEvent) => void,
  onContainerMouseOut: (e: EdgelessSelectionEvent) => void
) {
  let startX = -Infinity;
  let startY = -Infinity;
  let isDragging = false;
  let last: EdgelessSelectionEvent | null = null;
  let rect: DOMRect | null = null;

  const mouseOutHandler = (e: MouseEvent) =>
    onContainerMouseOut(toSelectionEvent(e, rect, startX, startY));

  const mouseDownHandler = (e: MouseEvent) => {
    rect = container.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = false;
    last = toSelectionEvent(e, rect, startX, startY);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mouseout', mouseOutHandler);
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    if (!rect) rect = container.getBoundingClientRect();

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
    e.preventDefault();
    e.stopPropagation();
  };

  const dblClickHandler = (e: MouseEvent) => {
    onContainerDblClick(toSelectionEvent(e, rect, startX, startY));
  };

  container.addEventListener('mousedown', mouseDownHandler);
  container.addEventListener('mousemove', mouseMoveHandler);
  container.addEventListener('contextmenu', contextMenuHandler);
  container.addEventListener('dblclick', dblClickHandler);

  const dispose = () => {
    container.removeEventListener('mousedown', mouseDownHandler);
    container.removeEventListener('mousemove', mouseMoveHandler);
    container.removeEventListener('contextmenu', contextMenuHandler);
    container.removeEventListener('dblclick', dblClickHandler);
  };
  return dispose;
}

export class EdgelessMouseManager {
  private _container: IEdgelessContainer;
  private _disposeCallback: () => void;

  constructor(container: IEdgelessContainer) {
    this._container = container;
    this._disposeCallback = initDomEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut
    );
  }

  private get _blocks(): GroupBlockModel[] {
    return (this._container.store.root?.children as GroupBlockModel[]) ?? [];
  }

  private _onContainerDragStart = (e: EdgelessSelectionEvent) => {
    // console.log('drag start', e);
  };

  private _onContainerDragMove = (e: EdgelessSelectionEvent) => {
    // console.log('drag move', e);
  };

  private _onContainerDragEnd = (e: EdgelessSelectionEvent) => {
    // console.log('drag end', e);
  };

  private _onContainerClick = (e: EdgelessSelectionEvent) => {
    const { viewport } = this._container;
    const [modelX, modelY] = toModelCoord(viewport, e.x, e.y);
    const selected = pick(this._blocks, modelX, modelY);
    if (selected) {
      this._container.setSelectionState({
        selected: [selected],
        box: getSelectionBoxBound(viewport, selected.xywh),
      });
    } else {
      this._container.setSelectionState({
        selected: [],
        box: getSelectionBoxBound(viewport, '[0,0,0,0]'),
      });
    }
  };

  private _onContainerDblClick = (e: EdgelessSelectionEvent) => {
    // console.log('dblclick', e);
  };

  private _onContainerMouseMove = (e: EdgelessSelectionEvent) => {
    // console.log('mousemove', e);
  };

  private _onContainerMouseOut = (e: EdgelessSelectionEvent) => {
    // console.log('mouseout', e);
  };

  dispose() {
    this._disposeCallback();
  }
}
