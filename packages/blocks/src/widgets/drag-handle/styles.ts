import { css } from 'lit';

export const DRAG_HANDLE_HEIGHT = 20; // px
export const DRAG_HANDLE_WIDTH = 16; // px

export const styles = css`
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
  .affine-drag-preview {
    --x: 0px;
    --y: 0px;
    height: auto;
    display: block;
    position: absolute;
    box-sizing: border-box;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-base);
    line-height: var(--affine-line-height);
    color: var(--affine-text-primary-color);
    font-weight: 400;
    top: 0;
    left: 0;
    opacity: 0.843;
    cursor: none;
    user-select: none;
    pointer-events: none;
    caret-color: transparent;
    transform-origin: 0 0;
    z-index: 2;
  }

  .affine-drag-preview > .affine-block-element {
    pointer-events: none;
  }

  .affine-drag-preview > .affine-block-element:first-child > *:first-child {
    margin-top: 0;
  }

  .affine-drag-preview .affine-rich-text {
    user-modify: read-only;
    -webkit-user-modify: read-only;
  }

  .affine-drag-preview.grabbing {
    cursor: grabbing;
    pointer-events: auto;
  }

  .affine-drag-preview.grabbing:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 24px;
    height: 24px;
    transform: translate(var(--x), var(--y));
  }
  .affine-drag-handle-container {
    top: 0;
    left: 0;
    position: fixed;
    overflow: hidden;
    width: ${DRAG_HANDLE_WIDTH + 8}px;
    transform-origin: 0 0;
    pointer-events: none;
    user-select: none;
  }
  .affine-drag-handle-line {
    opacity: 0;
    width: 1px;
    height: 100%;
    position: absolute;
    left: ${(DRAG_HANDLE_WIDTH - 1) / 2}px;
    background-color: var(--affine-icon-color);
    transition: opacity ease-in-out 300ms;
    pointer-events: none;
  }
  .affine-drag-handle {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${DRAG_HANDLE_WIDTH}px;
    height: ${DRAG_HANDLE_HEIGHT}px;
    border-radius: 1px;
    pointer-events: auto;
    color: var(--affine-icon-color);
  }
  @media print {
    .affine-drag-handle-line {
      display: none;
    }
    .affine-drag-handle {
      display: none;
    }
  }
  .affine-drag-handle-normal {
    display: flex;
  }
  .affine-drag-handle-hover {
    transition: opacity ease-in-out 300ms;
  }
  .affine-drag-handle-hover {
    display: none;
  }
  .affine-drag-handle-container:hover > .affine-drag-handle {
    cursor: grab;
  }
  .affine-drag-handle-container:hover > .affine-drag-handle-line {
    opacity: 1;
  }
  .affine-drag-handle-container:hover .affine-drag-handle-normal,
  .affine-drag-handle-container[data-selected] .affine-drag-handle-normal {
    display: none !important;
  }
  .affine-drag-handle-container:hover .affine-drag-handle-hover,
  .affine-drag-handle-container[data-selected] .affine-drag-handle-hover {
    display: flex !important;
  }
`;
