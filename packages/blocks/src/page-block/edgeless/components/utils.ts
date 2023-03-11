import type { Bound } from '@blocksuite/phasor';
import { deserializeXYWH, type SurfaceViewport } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';

import type { Selectable } from '../selection-manager.js';
import { getSelectionBoxBound, getXYWH, isTopLevelBlock } from '../utils.js';

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

export function getSelectableBounds(
  selected: Selectable[]
): Map<string, Bound> {
  const bounds = new Map<string, Bound>();
  for (const s of selected) {
    let bound: Bound;
    if (isTopLevelBlock(s)) {
      const [x, y, w, h] = deserializeXYWH(getXYWH(s));
      bound = { x, y, w, h };
    } else {
      bound = { x: s.x, y: s.y, w: s.w, h: s.h };
    }
    bounds.set(s.id, bound);
  }
  return bounds;
}
