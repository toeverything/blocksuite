import { html, nothing } from 'lit';

import type { IVec } from '../../../../surface-block/index.js';

export enum HandleDirection {
  Bottom = 'bottom',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
  Left = 'left',
  Right = 'right',
  Top = 'top',
  TopLeft = 'top-left',
  TopRight = 'top-right',
}

function ResizeHandle(
  handleDirection: HandleDirection,
  onPointerDown?: (e: PointerEvent, direction: HandleDirection) => void,
  updateCursor?: (
    dragging: boolean,
    options?: {
      point?: IVec;
      target?: HTMLElement;
      type: 'resize' | 'rotate';
    }
  ) => void,
  hideEdgeHandle?: boolean
) {
  const handlerPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    onPointerDown && onPointerDown(e, handleDirection);
  };

  const pointerEnter = (type: 'resize' | 'rotate') => (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1 || !updateCursor) return;

    const { clientX, clientY } = e;
    const target = e.target as HTMLElement;
    const point = [clientX, clientY];

    updateCursor(true, { point, target, type });
  };

  const pointerLeave = (e: PointerEvent) => {
    e.stopPropagation();
    if (e.buttons === 1 || !updateCursor) return;

    updateCursor(false);
  };

  const rotationTpl =
    handleDirection === HandleDirection.Top ||
    handleDirection === HandleDirection.Bottom ||
    handleDirection === HandleDirection.Left ||
    handleDirection === HandleDirection.Right
      ? nothing
      : html`<div
          class="rotate"
          @pointerover=${pointerEnter('rotate')}
          @pointerout=${pointerLeave}
        ></div>`;

  return html`<div
    class="handle"
    aria-label=${handleDirection}
    @pointerdown=${handlerPointerDown}
  >
    ${rotationTpl}
    <div
      class="resize${hideEdgeHandle && ' transparent-handle'}"
      @pointerover=${pointerEnter('resize')}
      @pointerout=${pointerLeave}
    ></div>
  </div>`;
}

/**
 * Indicate how selected elements can be resized.
 *
 * - edge: The selected elements can only be resized dragging edge, usually when note element is selected
 * - all: The selected elements can be resize both dragging edge or corner, usually when all elements are `shape`
 * - none: The selected elements can't be resized, usually when all elements are `connector`
 * - corner: The selected elements can only be resize dragging corner, this is by default mode
 * - edgeAndCorner: The selected elements can be resize both dragging left right edge or corner, usually when all elements are 'text'
 */
export type ResizeMode = 'all' | 'corner' | 'edge' | 'edgeAndCorner' | 'none';

export function ResizeHandles(
  resizeMode: ResizeMode,
  onPointerDown: (e: PointerEvent, direction: HandleDirection) => void,
  updateCursor?: (
    dragging: boolean,
    options?: {
      point?: IVec;
      target?: HTMLElement;
      type: 'resize' | 'rotate';
    }
  ) => void
) {
  const getCornerHandles = () => {
    const handleTopLeft = ResizeHandle(
      HandleDirection.TopLeft,
      onPointerDown,
      updateCursor
    );
    const handleTopRight = ResizeHandle(
      HandleDirection.TopRight,
      onPointerDown,
      updateCursor
    );
    const handleBottomLeft = ResizeHandle(
      HandleDirection.BottomLeft,
      onPointerDown,
      updateCursor
    );
    const handleBottomRight = ResizeHandle(
      HandleDirection.BottomRight,
      onPointerDown,
      updateCursor
    );
    return {
      handleBottomLeft,
      handleBottomRight,
      handleTopLeft,
      handleTopRight,
    };
  };
  const getEdgeHandles = (hideEdgeHandle?: boolean) => {
    const handleLeft = ResizeHandle(
      HandleDirection.Left,
      onPointerDown,
      updateCursor,
      hideEdgeHandle
    );
    const handleRight = ResizeHandle(
      HandleDirection.Right,
      onPointerDown,
      updateCursor,
      hideEdgeHandle
    );
    return { handleLeft, handleRight };
  };
  const getEdgeVerticalHandles = (hideEdgeHandle?: boolean) => {
    const handleTop = ResizeHandle(
      HandleDirection.Top,
      onPointerDown,
      updateCursor,
      hideEdgeHandle
    );
    const handleBottom = ResizeHandle(
      HandleDirection.Bottom,
      onPointerDown,
      updateCursor,
      hideEdgeHandle
    );
    return { handleBottom, handleTop };
  };
  switch (resizeMode) {
    case 'corner': {
      const {
        handleBottomLeft,
        handleBottomRight,
        handleTopLeft,
        handleTopRight,
      } = getCornerHandles();

      // prettier-ignore
      return html`
        ${handleTopLeft}
        ${handleTopRight}
        ${handleBottomLeft}
        ${handleBottomRight}
      `;
    }
    case 'edge': {
      const { handleLeft, handleRight } = getEdgeHandles();
      return html`${handleLeft} ${handleRight}`;
    }
    case 'all': {
      const {
        handleBottomLeft,
        handleBottomRight,
        handleTopLeft,
        handleTopRight,
      } = getCornerHandles();
      const { handleLeft, handleRight } = getEdgeHandles(true);
      const { handleBottom, handleTop } = getEdgeVerticalHandles(true);

      // prettier-ignore
      return html`
        ${handleTopLeft}
        ${handleTop}
        ${handleTopRight}
        ${handleRight}
        ${handleBottomRight}
        ${handleBottom}
        ${handleBottomLeft}
        ${handleLeft}
      `;
    }
    case 'edgeAndCorner': {
      const {
        handleBottomLeft,
        handleBottomRight,
        handleTopLeft,
        handleTopRight,
      } = getCornerHandles();
      const { handleLeft, handleRight } = getEdgeHandles(true);

      return html`
        ${handleTopLeft} ${handleTopRight} ${handleRight} ${handleBottomRight}
        ${handleBottomLeft} ${handleLeft}
      `;
    }
    case 'none': {
      return nothing;
    }
  }
}
