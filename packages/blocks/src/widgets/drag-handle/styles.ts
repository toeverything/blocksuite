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
    position: fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${DRAG_HANDLE_WIDTH + 8}px;
    transform-origin: 0 0;
    pointer-events: none;
    user-select: none;
  }
  .affine-drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${DRAG_HANDLE_WIDTH}px;
    min-height: ${DRAG_HANDLE_HEIGHT}px;
    pointer-events: auto;
    color: var(--affine-icon-color);
  }
  @media print {
    .affine-drag-handle {
      display: none;
    }
  }
  .affine-drag-handle-grabber {
    width: 4px;
    height: 12px;
    border-radius: 1px;
    background: var(--affine-placeholder-color);
    transition: all 0.3s ease-in-out;
  }
  .affine-drag-handle-grabber.from-top {
    transform-origin: 0 0;
  }
  .affine-drag-handle-container:hover > .affine-drag-handle {
    cursor: grab;
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
    transition: width 0.5s ease-in-out, height 0.5s ease-in-out;
    transform-origin: left top;
    pointer-events: none;
    z-index: 2;
  }
`;
