import type { Bound } from '@blocksuite/phasor';

import { HandleDirection } from './selected-handle.js';

type OnDragMoveCallback = (delta: Bound) => void;

type OnDragEndCallback = () => void;

export class Drag {
  private _element: HTMLElement;
  private _onDragMoveCallback: OnDragMoveCallback;
  private _onDragEndCallback: OnDragEndCallback;

  private _dragDirection: HandleDirection = HandleDirection.Left;
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(
    element: HTMLElement,
    onDragMove: OnDragMoveCallback,
    onDragEnd: OnDragEndCallback
  ) {
    this._element = element;
    this._onDragMoveCallback = onDragMove;
    this._onDragEndCallback = onDragEnd;
  }

  private _onDragMove = (e: MouseEvent) => {
    const direction = this._dragDirection;
    const { x: lastX, y: lastY } = this._dragLastPos;
    this._dragLastPos = {
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
      case HandleDirection.RightTop: {
        y = y - deltaY;
        w = w - deltaX;
        h = h + deltaY;
        break;
      }
      case HandleDirection.LeftBottom: {
        x = x - deltaX;
        w = w + deltaX;
        h = h - deltaY;
        break;
      }
      case HandleDirection.RightBottom: {
        w = w - deltaX;
        h = h - deltaY;
        break;
      }
      case HandleDirection.LeftTop: {
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

    this._onDragMoveCallback({ x, y, w, h });
  };

  private _onDragEnd = (_: MouseEvent) => {
    this._onDragEndCallback();
    const parentElement = this._element.parentElement;
    parentElement?.removeEventListener('mousemove', this._onDragMove);
    parentElement?.removeEventListener('mouseup', this._onDragEnd);
  };

  onMouseDown = (e: MouseEvent, direction: HandleDirection) => {
    // prevent selection action being fired
    e.stopPropagation();

    this._dragDirection = direction;
    this._dragLastPos = {
      x: e.clientX,
      y: e.clientY,
    };

    const parentElement = this._element.parentElement;
    // parent ele is the edgeless block container
    parentElement?.addEventListener('mousemove', this._onDragMove);
    parentElement?.addEventListener('mouseup', this._onDragEnd);
  };
}
