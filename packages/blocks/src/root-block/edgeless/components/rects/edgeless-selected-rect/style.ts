import { css } from 'lit';
export const edgelessSelectedRectStyles = css`
  :host {
    display: block;
    user-select: none;
    contain: size layout;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .affine-edgeless-selected-rect {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: center center;
    border-radius: 0;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 1;
    border-color: var(--affine-blue);
    border-width: var(--affine-border-width);
    border-style: solid;
    transform: translate(0, 0) rotate(0);
  }

  .affine-edgeless-selected-rect .handle {
    position: absolute;
    user-select: none;
    outline: none;
    pointer-events: auto;

    /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
    touch-action: none;
  }

  .affine-edgeless-selected-rect .handle[aria-label^='top-'],
  .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] {
    width: 18px;
    height: 18px;
    box-sizing: border-box;
    z-index: 10;
  }

  .affine-edgeless-selected-rect .handle[aria-label^='top-'] .resize,
  .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] .resize {
    position: absolute;
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border-radius: 50%;
    border: 2px var(--affine-blue) solid;
    background: white;
  }

  .affine-edgeless-selected-rect .handle[aria-label^='top-'] .rotate,
  .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] .rotate {
    position: absolute;
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    background: transparent;
  }

  /* -18 + 6.5 */
  .affine-edgeless-selected-rect .handle[aria-label='top-left'] {
    left: -12px;
    top: -12px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='top-left'] .resize {
    right: 0;
    bottom: 0;
  }
  .affine-edgeless-selected-rect .handle[aria-label='top-left'] .rotate {
    right: 6px;
    bottom: 6px;
  }

  .affine-edgeless-selected-rect .handle[aria-label='top-right'] {
    top: -12px;
    right: -12px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='top-right'] .resize {
    left: 0;
    bottom: 0;
  }
  .affine-edgeless-selected-rect .handle[aria-label='top-right'] .rotate {
    left: 6px;
    bottom: 6px;
  }

  .affine-edgeless-selected-rect .handle[aria-label='bottom-right'] {
    right: -12px;
    bottom: -12px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='bottom-right'] .resize {
    left: 0;
    top: 0;
  }
  .affine-edgeless-selected-rect .handle[aria-label='bottom-right'] .rotate {
    left: 6px;
    top: 6px;
  }

  .affine-edgeless-selected-rect .handle[aria-label='bottom-left'] {
    bottom: -12px;
    left: -12px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='bottom-left'] .resize {
    right: 0;
    top: 0;
  }
  .affine-edgeless-selected-rect .handle[aria-label='bottom-left'] .rotate {
    right: 6px;
    top: 6px;
  }

  .affine-edgeless-selected-rect .handle[aria-label='top'],
  .affine-edgeless-selected-rect .handle[aria-label='bottom'],
  .affine-edgeless-selected-rect .handle[aria-label='left'],
  .affine-edgeless-selected-rect .handle[aria-label='right'] {
    border: 0;
    background: transparent;
    border-color: var('--affine-blue');
  }

  .affine-edgeless-selected-rect .handle[aria-label='left'],
  .affine-edgeless-selected-rect .handle[aria-label='right'] {
    top: 0;
    bottom: 0;
    height: 100%;
    width: 6px;
  }

  .affine-edgeless-selected-rect .handle[aria-label='top'],
  .affine-edgeless-selected-rect .handle[aria-label='bottom'] {
    left: 0;
    right: 0;
    width: 100%;
    height: 6px;
  }

  /* calc(-1px - (6px - 1px) / 2) = -3.5px */
  .affine-edgeless-selected-rect .handle[aria-label='left'] {
    left: -3.5px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='right'] {
    right: -3.5px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='top'] {
    top: -3.5px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='bottom'] {
    bottom: -3.5px;
  }

  .affine-edgeless-selected-rect .handle[aria-label='top'] .resize,
  .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize,
  .affine-edgeless-selected-rect .handle[aria-label='left'] .resize,
  .affine-edgeless-selected-rect .handle[aria-label='right'] .resize {
    width: 100%;
    height: 100%;
  }

  .affine-edgeless-selected-rect .handle[aria-label='top'] .resize:after,
  .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize:after,
  .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after,
  .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
    position: absolute;
    width: 7px;
    height: 7px;
    box-sizing: border-box;
    border-radius: 6px;
    z-index: 10;
    content: '';
    background: white;
  }

  .affine-edgeless-selected-rect
    .handle[aria-label='top']
    .transparent-handle:after,
  .affine-edgeless-selected-rect
    .handle[aria-label='bottom']
    .transparent-handle:after,
  .affine-edgeless-selected-rect
    .handle[aria-label='left']
    .transparent-handle:after,
  .affine-edgeless-selected-rect
    .handle[aria-label='right']
    .transparent-handle:after {
    opacity: 0;
  }

  .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after,
  .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
    top: calc(50% - 6px);
  }

  .affine-edgeless-selected-rect .handle[aria-label='top'] .resize:after,
  .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize:after {
    left: calc(50% - 6px);
  }

  .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after {
    left: -0.5px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
    right: -0.5px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='top'] .resize:after {
    top: -0.5px;
  }
  .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize:after {
    bottom: -0.5px;
  }

  .affine-edgeless-selected-rect .handle .resize::before {
    content: '';
    display: none;
    position: absolute;
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M23 3H19C10.1634 3 3 10.1634 3 19V23' stroke='black' stroke-opacity='0.3' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }
  .affine-edgeless-selected-rect[data-mode='scale']
    .handle[aria-label='top-left']
    .resize:hover::before,
  .affine-edgeless-selected-rect[data-scale-direction='top-left'][data-scale-percent]
    .handle[aria-label='top-left']
    .resize::before {
    display: block;
    top: 0px;
    left: 0px;
    transform: translate(-100%, -100%);
  }
  .affine-edgeless-selected-rect[data-mode='scale']
    .handle[aria-label='top-right']
    .resize:hover::before,
  .affine-edgeless-selected-rect[data-scale-direction='top-right'][data-scale-percent]
    .handle[aria-label='top-right']
    .resize::before {
    display: block;
    top: 0px;
    right: 0px;
    transform: translate(100%, -100%) rotate(90deg);
  }
  .affine-edgeless-selected-rect[data-mode='scale']
    .handle[aria-label='bottom-right']
    .resize:hover::before,
  .affine-edgeless-selected-rect[data-scale-direction='bottom-right'][data-scale-percent]
    .handle[aria-label='bottom-right']
    .resize::before {
    display: block;
    bottom: 0px;
    right: 0px;
    transform: translate(100%, 100%) rotate(180deg);
  }
  .affine-edgeless-selected-rect[data-mode='scale']
    .handle[aria-label='bottom-left']
    .resize:hover::before,
  .affine-edgeless-selected-rect[data-scale-direction='bottom-left'][data-scale-percent]
    .handle[aria-label='bottom-left']
    .resize::before {
    display: block;
    bottom: 0px;
    left: 0px;
    transform: translate(-100%, 100%) rotate(-90deg);
  }

  .affine-edgeless-selected-rect::after {
    content: attr(data-scale-percent);
    display: none;
    position: absolute;
    color: var(--affine-icon-color);
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-family: var(--affine-font-family);
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
  }
  .affine-edgeless-selected-rect[data-scale-direction='top-left']::after {
    display: block;
    top: -20px;
    left: -20px;
    transform: translate(-100%, -100%);
  }
  .affine-edgeless-selected-rect[data-scale-direction='top-right']::after {
    display: block;
    top: -20px;
    right: -20px;
    transform: translate(100%, -100%);
  }
  .affine-edgeless-selected-rect[data-scale-direction='bottom-right']::after {
    display: block;
    bottom: -20px;
    right: -20px;
    transform: translate(100%, 100%);
  }
  .affine-edgeless-selected-rect[data-scale-direction='bottom-left']::after {
    display: block;
    bottom: -20px;
    left: -20px;
    transform: translate(-100%, 100%);
  }
`;
