import { GroupBlockModel } from '../../group-block';
import { ViewportState, IEdgelessContainer, XYWH } from './edgeless-page-block';
import {
  SelectionEvent,
  initMouseEventHandlers,
  resetNativeSeletion,
} from '../../__internal__';

const MIN_ZOOM = 0.3;

function applyDeltaZoom(current: ViewportState, delta: number): ViewportState {
  const val = (current.zoom * (100 + delta)) / 100;
  const newZoom = Math.max(val, MIN_ZOOM);
  // TODO ensure center stable
  return { ...current, zoom: newZoom };
}

function applyDeltaCenter(
  current: ViewportState,
  deltaX: number,
  deltaY: number
): ViewportState {
  const newX = current.viewportX + deltaX;
  const newY = current.viewportY + deltaY;
  return { ...current, viewportX: newX, viewportY: newY };
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

export function getSelectionBoxBound(viewport: ViewportState, xywh: string) {
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const [x, y] = toViewCoord(viewport, modelX, modelY);
  return {
    x,
    y,
    w: modelW * viewport.zoom,
    h: modelH * viewport.zoom,
  };
}

export function refreshSelectionBox(container: IEdgelessContainer) {
  container.setSelectionState({
    selected: container.selectionState.selected,
    box: getSelectionBoxBound(
      container.viewport,
      container.selectionState.selected[0]?.xywh ?? '[0,0,0,0]'
    ),
  });
}

function initWheelEventHandlers(container: IEdgelessContainer) {
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const { viewport } = container;

    // pan
    if (!e.ctrlKey) {
      const dx = e.deltaX / viewport.zoom;
      const dy = e.deltaY / viewport.zoom;
      const newState = applyDeltaCenter(viewport, dx, dy);
      container.viewport = newState;
      refreshSelectionBox(container);
    }
    // zoom
    else {
      const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      const newState = applyDeltaZoom(viewport, delta);
      container.viewport = newState;
      refreshSelectionBox(container);
    }
  };

  container.addEventListener('wheel', wheelHandler);
  const dispose = () => container.removeEventListener('wheel', wheelHandler);
  return dispose;
}

export class EdgelessMouseManager {
  private _container: IEdgelessContainer;
  private _mouseDisposeCallback: () => void;
  private _wheelDisposeCallback: () => void;

  constructor(container: IEdgelessContainer) {
    this._container = container;
    this._mouseDisposeCallback = initMouseEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut
    );
    this._wheelDisposeCallback = initWheelEventHandlers(container);
  }

  private get _store() {
    return this._container.store;
  }

  private get _blocks(): GroupBlockModel[] {
    return (this._store.root?.children as GroupBlockModel[]) ?? [];
  }

  private _onContainerDragStart = (e: SelectionEvent) => {
    // console.log('drag start', e);
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    this._container.selectionState.selected.forEach(block => {
      const [modelX, modelY, modelW, modelH] = JSON.parse(block.xywh) as XYWH;

      this._store.updateBlock(block, {
        xywh: JSON.stringify([
          modelX + e.delta.x,
          modelY + e.delta.y,
          modelW,
          modelH,
        ]),
      });
      refreshSelectionBox(this._container);
    });
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    // console.log('drag end', e);
  };

  private _onContainerClick = (e: SelectionEvent) => {
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
      resetNativeSeletion(null);
    }
  };

  private _onContainerDblClick = (e: SelectionEvent) => {
    console.log('dblclick', e);
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    // console.log('mousemove', e);
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    // console.log('mouseout', e);
  };

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
  }
}
