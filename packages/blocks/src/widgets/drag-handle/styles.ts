import { css } from 'lit';

export const DRAG_HANDLE_HEIGHT = 24; // px
export const DRAG_HANDLE_WIDTH = 16; // px

export const styles = css`
  .affine-drag-handle-widget {
    display: flex;
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
    transition:
      transform 0.25s ease,
      height 0.25s ease;
  }
  .affine-drag-handle-grabber {
    width: 4px;
    height: 12px;
    border-radius: 1px;
    background: var(--affine-placeholder-color);
    transition:
      height 0.25s ease,
      width 0.25s ease;
  }
  .affine-drag-handle-container:hover {
    cursor: grab;
  }
  @media print {
    .affine-drag-handle-widget {
      display: none;
    }
  }
  .affine-drag-indicator {
    position: fixed;
    top: 0;
    left: 0;
    background: var(--affine-primary-color);
    transition-property: width, height, transform;
    transition-duration: 100ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-delay: 0s;
    transform-origin: 0 0;
    pointer-events: none;
    z-index: 2;
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
