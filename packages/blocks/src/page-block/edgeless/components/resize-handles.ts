import { html, nothing } from 'lit';

export enum HandleDirection {
  Left = 'left',
  Right = 'right',
  TopLeft = 'top-left',
  BottomLeft = 'bottom-left',
  TopRight = 'top-right',
  BottomRight = 'bottom-right',
}

function ResizeHandle(
  handleDirection: HandleDirection,
  onPointerDown?: (e: PointerEvent, direction: HandleDirection) => void
) {
  const handlerPointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    onPointerDown && onPointerDown(e, handleDirection);
  };

  return html`<div
    aria-label=${`handle-${handleDirection}`}
    @pointerdown=${handlerPointerDown}
  ></div>`;
}

export type ResizeMode = 'corner' | 'edge' | 'none';
export function ResizeHandles(
  resizeMode: ResizeMode,
  onPointerDown: (e: PointerEvent, direction: HandleDirection) => void
) {
  switch (resizeMode) {
    case 'corner': {
      const handleTopLeft = ResizeHandle(
        HandleDirection.TopLeft,
        onPointerDown
      );
      const handleTopRight = ResizeHandle(
        HandleDirection.TopRight,
        onPointerDown
      );
      const handleBottomLeft = ResizeHandle(
        HandleDirection.BottomLeft,
        onPointerDown
      );
      const handleBottomRight = ResizeHandle(
        HandleDirection.BottomRight,
        onPointerDown
      );

      // prettier-ignore
      return html`
        ${handleTopLeft}
        ${handleTopRight}
        ${handleBottomLeft}
        ${handleBottomRight}
      `;
    }
    case 'edge': {
      const handleLeft = ResizeHandle(HandleDirection.Left, onPointerDown);
      const handleRight = ResizeHandle(HandleDirection.Right, onPointerDown);

      return html`${handleLeft} ${handleRight}`;
    }
    case 'none': {
      return nothing;
    }
  }
}
