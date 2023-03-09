import type { Bound } from '@blocksuite/phasor';

import { HandleDirection } from './resize-handles.js';

type ReizeMoveHandler = (delta: Bound) => void;

type ResizeEndHandler = () => void;

export class HandleResizeManager {
  private _element: HTMLElement;
  private _onResizeMove: ReizeMoveHandler;
  private _onResizeEnd: ResizeEndHandler;

  private _dragDirection: HandleDirection = HandleDirection.Left;
  private _lastDragPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(
    element: HTMLElement,
    onResizeMove: ReizeMoveHandler,
    onResizeEnd: ResizeEndHandler
  ) {
    this._element = element;
    this._onResizeMove = onResizeMove;
    this._onResizeEnd = onResizeEnd;
  }

  private _onMouseMove = (e: MouseEvent) => {
    const direction = this._dragDirection;
    const { x: lastX, y: lastY } = this._lastDragPos;
    this._lastDragPos = {
      x: e.clientX,
      y: e.clientY,
    };

    let x = 0;
    let y = 0;
    let w = 0;
    let h = 0;

    const deltaX = lastX - e.clientX;
    const deltaY = lastY - e.clientY;

    switch (direction) {
      case HandleDirection.TopRight: {
        y = y - deltaY;
        w = w - deltaX;
        h = h + deltaY;
        break;
      }
      case HandleDirection.BottomLeft: {
        x = x - deltaX;
        w = w + deltaX;
        h = h - deltaY;
        break;
      }
      case HandleDirection.BottomRight: {
        w = w - deltaX;
        h = h - deltaY;
        break;
      }
      case HandleDirection.TopLeft: {
        y = y - deltaY;
        x = x - deltaX;
        w = w + deltaX;
        h = h + deltaY;
        break;
      }
      case HandleDirection.Left: {
        x = x - deltaX;
        w = w + deltaX;
        break;
      }
      case HandleDirection.Right: {
        w = w - deltaX;
        break;
      }
    }
    if (w === 0 && y === 0 && w === 0 && h === 0) {
      return;
    }

    this._onResizeMove({ x, y, w, h });
  };

  private _onMouseUp = (_: MouseEvent) => {
    this._onResizeEnd();
    const parentElement = this._element.parentElement;
    parentElement?.removeEventListener('mousemove', this._onMouseMove);
    parentElement?.removeEventListener('mouseup', this._onMouseUp);
  };

  onMouseDown = (e: MouseEvent, direction: HandleDirection) => {
    // Prevent selection action from being triggered
    e.stopPropagation();

    this._dragDirection = direction;
    this._lastDragPos = {
      x: e.clientX,
      y: e.clientY,
    };

    const parentElement = this._element.parentElement;
    // The parent element is the edgeless block container
    parentElement?.addEventListener('mousemove', this._onMouseMove);
    parentElement?.addEventListener('mouseup', this._onMouseUp);
  };
}
