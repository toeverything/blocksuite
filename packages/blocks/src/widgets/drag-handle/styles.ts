import { css } from 'lit';

export const DRAG_HANDLE_HEIGHT = 24; // px
export const DRAG_HANDLE_WIDTH = 16; // px

export const styles = css`
  .affine-drag-handle-widget {
    display: flex;
    position: absolute;
    left: 0;
    top: 0;
    contain: size layout;
  }

  .affine-drag-handle-container {
    top: 0;
    left: 0;
    position: absolute;
    display: flex;
    justify-content: center;
    width: ${DRAG_HANDLE_WIDTH}px;
    min-height: 12px;
    pointer-events: auto;
    user-select: none;
    box-sizing: border-box;
  }
  .affine-drag-handle-grabber {
    width: 4px;
    height: 100%;
    border-radius: 1px;
    background: var(--affine-placeholder-color);
    transition: width 0.25s ease;
  }
  .affine-drag-handle-container:hover {
    cursor: grab;
  }
  @media print {
    .affine-drag-handle-widget {
      display: none;
    }
  }
  .affine-drag-hover-rect {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 6px;
    background: var(--affine-hover-color);
    pointer-events: none;
    z-index: 2;
    animation: expand 0.25s forwards;
  }
  @keyframes expand {
    0% {
      width: 0;
      height: 0;
    }
  }
`;
