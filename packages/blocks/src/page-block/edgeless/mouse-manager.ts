import { IPoint } from '@blocksuite/shared';

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

interface EdgelessSelectionHandlers {
  onContainerDragStart: (e: EdgelessSelectionEvent) => void;
  onContainerDragMove: (e: EdgelessSelectionEvent) => void;
  onContainerDragEnd: (e: EdgelessSelectionEvent) => void;
  onContainerClick: (e: EdgelessSelectionEvent) => void;
  onContainerDblClick: (e: EdgelessSelectionEvent) => void;
  onContainerMouseMove: (e: EdgelessSelectionEvent) => void;
  onContainerMouseOut: (e: EdgelessSelectionEvent) => void;
}

const handlers: EdgelessSelectionHandlers = {
  onContainerDragStart(e: EdgelessSelectionEvent) {
    // console.log('drag start');
  },
  onContainerDragMove(e: EdgelessSelectionEvent) {
    // console.log('drag move');
  },
  onContainerDragEnd(e: EdgelessSelectionEvent) {
    // console.log('drag end');
  },
  onContainerClick(e: EdgelessSelectionEvent) {
    // console.log('click', e);
  },
  onContainerDblClick(e: EdgelessSelectionEvent) {
    // console.log('dbl click');
  },
  onContainerMouseMove(e: EdgelessSelectionEvent) {
    // console.log('mouse move');
  },
  onContainerMouseOut(e: EdgelessSelectionEvent) {
    // console.log('mouse out');
  },
};

function isFarEnough(a: IPoint, b: IPoint, d = 2) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
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

export class EdgelessMouseManager {
  private _ctx = {
    startX: -Infinity,
    startY: -Infinity,
    isDragging: false,
    last: <EdgelessSelectionEvent | null>null,
    rect: <DOMRect | null>null,
  };

  private _container: HTMLElement;

  constructor(container: HTMLElement) {
    this._container = container;
    this._initMouseHandlers();
  }

  private _mouseOutHandler = (e: MouseEvent) => {
    const { rect, startX, startY } = this._ctx;
    handlers.onContainerMouseOut(toSelectionEvent(e, rect, startX, startY));
  };

  private _mouseDownHandler = (e: MouseEvent) => {
    const { _ctx } = this;
    e.preventDefault();
    _ctx.rect = this._container.getBoundingClientRect();
    _ctx.startX = e.clientX - _ctx.rect.left;
    _ctx.startY = e.clientY - _ctx.rect.top;
    _ctx.isDragging = false;
    _ctx.last = toSelectionEvent(e, _ctx.rect, _ctx.startX, _ctx.startY);
    document.addEventListener('mouseup', this._mouseUpHandler);
    document.addEventListener('mouseout', this._mouseOutHandler);
  };

  private _mouseMoveHandler = (e: MouseEvent) => {
    const { _ctx, _container } = this;

    if (!_ctx.rect) {
      _ctx.rect = _container.getBoundingClientRect();
    }

    const a = { x: _ctx.startX, y: _ctx.startY };
    const offsetX = e.clientX - _ctx.rect.left;
    const offsetY = e.clientY - _ctx.rect.top;
    const b = { x: offsetX, y: offsetY };

    if (!_ctx.last) {
      handlers.onContainerMouseMove(
        toSelectionEvent(e, _ctx.rect, _ctx.startX, _ctx.startY, _ctx.last)
      );
      return;
    }

    if (isFarEnough(a, b) && !_ctx.isDragging) {
      _ctx.isDragging = true;
      handlers.onContainerDragStart(_ctx.last);
    }

    if (_ctx.isDragging) {
      const { rect, startX, startY, last } = _ctx;
      handlers.onContainerDragMove(
        toSelectionEvent(e, rect, startX, startY, last)
      );
      handlers.onContainerMouseMove(
        toSelectionEvent(e, rect, startX, startY, last)
      );
      _ctx.last = toSelectionEvent(e, rect, startX, startY);
    }
  };

  private _mouseUpHandler = (e: MouseEvent) => {
    const { _ctx } = this;
    if (!_ctx.isDragging)
      handlers.onContainerClick(
        toSelectionEvent(e, _ctx.rect, _ctx.startX, _ctx.startY)
      );
    else
      handlers.onContainerDragEnd(
        toSelectionEvent(e, _ctx.rect, _ctx.startX, _ctx.startY, _ctx.last)
      );

    _ctx.startX = _ctx.startY = -Infinity;
    _ctx.isDragging = false;
    _ctx.last = null;

    document.removeEventListener('mouseup', this._mouseUpHandler);
    document.removeEventListener('mouseout', this._mouseOutHandler);
  };

  private _contextMenuHandler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  private _dblClickHandler = (e: MouseEvent) => {
    const { _ctx } = this;
    const { rect, startX, startY } = _ctx;
    handlers.onContainerDblClick(toSelectionEvent(e, rect, startX, startY));
  };

  private _initMouseHandlers() {
    const { _container } = this;
    _container.addEventListener('mousedown', this._mouseDownHandler);
    _container.addEventListener('mousemove', this._mouseMoveHandler);
    _container.addEventListener('contextmenu', this._contextMenuHandler);
    _container.addEventListener('dblclick', this._dblClickHandler);
  }

  dispose() {
    const { _container } = this;
    _container.removeEventListener('mousedown', this._mouseDownHandler);
    _container.removeEventListener('mousemove', this._mouseMoveHandler);
    _container.removeEventListener('contextmenu', this._contextMenuHandler);
    _container.removeEventListener('dblclick', this._dblClickHandler);
  }
}
