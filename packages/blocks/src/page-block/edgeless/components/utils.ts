import type { SurfaceViewport } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';
import { html } from 'lit';

import type { Selectable } from '../selection-manager.js';
import { getSelectionBoxBound, getXYWH } from '../utils.js';
import { HandleDirection, SelectedHandle } from './selected-handle.js';

export function getCommonRectStyle(
  rect: DOMRect,
  active = false,
  selected = false
) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    borderRadius: '0',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    zIndex: '1',
    backgroundColor: !active && selected ? 'var(--affine-selected-color)' : '',
  };
}

export type ResizeMode = 'resize' | 'row-resize';
export function getHandles(
  rect: DOMRect,
  resizeMode: ResizeMode,
  onMouseDown: (e: MouseEvent, direction: HandleDirection) => void
) {
  switch (resizeMode) {
    case 'resize': {
      const leftTop = [rect.x, rect.y];
      const rightTop = [rect.x + rect.width, rect.y];
      const leftBottom = [rect.x, rect.y + rect.height];
      const rightBottom = [rect.x + rect.width, rect.y + rect.height];

      return html`
        ${SelectedHandle(
          leftTop[0],
          leftTop[1],
          HandleDirection.LeftTop,
          onMouseDown
        )}
        ${SelectedHandle(
          rightTop[0],
          rightTop[1],
          HandleDirection.RightTop,
          onMouseDown
        )}
        ${SelectedHandle(
          leftBottom[0],
          leftBottom[1],
          HandleDirection.LeftBottom,
          onMouseDown
        )}
        ${SelectedHandle(
          rightBottom[0],
          rightBottom[1],
          HandleDirection.RightBottom,
          onMouseDown
        )}
      `;
    }
    case 'row-resize': {
      const leftCenter = [rect.x, rect.y + rect.height / 2];
      const rightCenter = [rect.x + rect.width, rect.y + rect.height / 2];

      return html`
        ${SelectedHandle(
          leftCenter[0],
          leftCenter[1],
          HandleDirection.Left,
          onMouseDown
        )}
        ${SelectedHandle(
          rightCenter[0],
          rightCenter[1],
          HandleDirection.Right,
          onMouseDown
        )}
      `;
    }
  }
}

export function getSelectedRect(
  selected: Selectable[],
  viewport: SurfaceViewport
): DOMRect {
  if (selected.length === 0) {
    return new DOMRect(0, 0, 0, 0);
  }
  const rects = selected.map(selectable => {
    const { x, y, width, height } = getSelectionBoxBound(
      viewport,
      getXYWH(selectable)
    );

    return {
      x,
      y,
      w: width,
      h: height,
    };
  });

  const commonBound = getCommonBound(rects);
  return new DOMRect(
    commonBound?.x,
    commonBound?.y,
    commonBound?.w,
    commonBound?.h
  );
}
