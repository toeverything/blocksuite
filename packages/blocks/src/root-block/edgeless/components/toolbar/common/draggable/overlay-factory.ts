import { render } from 'lit';

import type { ElementInfo, OverlayLayer } from './types.js';

export type DraggingInfo<T> = {
  edgelessRect: DOMRect;
  element: HTMLElement;
  elementInfo: ElementInfo<T>;
  elementRectOriginal: DOMRect;
  moved: boolean;
  offsetPos: { x: number; y: number };
  parentToMount: HTMLElement;
  scopeRect: DOMRect | null;
  startPos: { x: number; y: number };
  startTime: number;
  validMoved: boolean;
};

export const defaultInfo = {
  edgelessRect: {} as DOMRect,
  element: null as unknown as HTMLElement,
  elementInfo: null as unknown as ElementInfo<unknown>,
  elementRectOriginal: {} as DOMRect,
  moved: false,
  offsetPos: { x: 0, y: 0 },
  parentToMount: null as unknown as HTMLElement,
  scopeRect: {} as DOMRect,
  startPos: { x: 0, y: 0 },
  startTime: 0,
  validMoved: false,
} satisfies DraggingInfo<unknown>;

const className = (name: string) =>
  `edgeless-draggable-control-overlay-${name}`;
const addClass = (node: HTMLElement, name: string) =>
  node.classList.add(className(name));

export const createShapeDraggingOverlay = <T>(
  info: DraggingInfo<T>
): OverlayLayer => {
  const { edgelessRect, element: originalElement, parentToMount } = info;
  const elementStyle = getComputedStyle(originalElement);
  const mask = document.createElement('div');
  addClass(mask, 'mask');
  Object.assign(mask.style, {
    height: edgelessRect.height + 'px',
    left: '0',
    overflow: 'hidden',
    position: 'absolute',
    top: '0',
    width: edgelessRect.width + 'px',
    zIndex: '9999',

    // for debug purpose
    // background: 'rgba(255, 0, 0, 0.1)',
  });

  const element = document.createElement('div');
  addClass(element, 'element');
  const transitionWrapper = document.createElement('div');
  addClass(transitionWrapper, 'transition-wrapper');
  Object.assign(transitionWrapper.style, {
    height: elementStyle.height,
    transform: 'scale(var(--scale, 1)) rotate(var(--rotate, 0deg))',
    transition: 'all 0.18s ease',
    width: elementStyle.width,
  });
  transitionWrapper.style.setProperty('--rotate', '0deg');
  transitionWrapper.style.setProperty('--scale', '1');

  render(info.elementInfo.preview, transitionWrapper);

  Object.assign(element.style, {
    cursor: 'grabbing',
    position: 'absolute',
    transform:
      'translate(var(--translate-x, 0), var(--translate-y, 0)) rotate(var(--rotate, 0deg)) scale(var(--scale, 1))',
    transition: 'inherit',
  });

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .${className('transition-wrapper')} > * {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;
  mask.append(styleTag);

  element.append(transitionWrapper);
  mask.append(element);
  parentToMount.append(mask);

  return { element, mask, transitionWrapper };
};
