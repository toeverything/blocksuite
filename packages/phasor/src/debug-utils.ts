import { DebugElement, type Element } from './elements.js';
import type { Renderer } from './renderer.js';

const DEBUG_ELEMENT_MAX = 150;
const DEBUG_ELEMEMNT_MIN = 120;

function randomInt(range: number, min = 0) {
  return Math.floor(Math.random() * (range - min)) + min;
}

function randomColor() {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
}

function createMockElement(id: number, rangeX: number, rangeY: number) {
  const x = randomInt(rangeX);
  const y = randomInt(rangeY);

  const size = randomInt(DEBUG_ELEMENT_MAX, DEBUG_ELEMEMNT_MIN);
  const element = new DebugElement(`${id}`);
  element.color = randomColor();
  element.setBound(x, y, size, size);
  return element;
}

export function initMockData(
  renderer: Renderer,
  count: number,
  rangeX: number,
  rangeY: number
) {
  const elements: Element[] = [];
  for (let i = 0; i < count; i++) {
    const element = createMockElement(i, rangeX, rangeY);
    elements.push(element);
  }
  renderer.load(elements);
}

export function bindWheelEvents(renderer: Renderer, mouseRoot: HTMLElement) {
  mouseRoot.addEventListener('wheel', e => {
    e.preventDefault();
    // pan
    if (!e.ctrlKey) {
      const dx = e.deltaX / renderer.zoom;
      const dy = e.deltaY / renderer.zoom;
      renderer.setCenter(renderer.centerX + dx, renderer.centerY + dy);
    }
    // zoom
    else {
      const delta = e.deltaX !== 0 ? -e.deltaX : -e.deltaY;
      renderer.applyDeltaZoom(delta);
    }
  });
}
