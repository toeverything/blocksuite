import { PathElement, RectElement, type Element } from './elements.js';
import type { Renderer } from './renderer.js';

const PATH_POINTS = 10;
const PATH_MAX = 150;
const PATH_MIN = 10;
const IMAGE_MAX = 150;
const IMAGE_MIN = 120;

function randomInt(range: number, min = 0) {
  return Math.floor(Math.random() * (range - min)) + min;
}

function randomColor() {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
}

function createMockElement(id: number, rangeX: number, rangeY: number) {
  const r = randomInt(100);

  const x = randomInt(rangeX);
  const y = randomInt(rangeY);
  if (r % 2 === 0) {
    const points: number[] = [];
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < PATH_POINTS; i++) {
      const x = randomInt(PATH_MAX, PATH_MIN);
      const y = randomInt(PATH_MAX, PATH_MIN);
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      points.push(x, y);
    }
    const element = new PathElement(`${id}`, points);
    element.color = randomColor();
    element.setBound(x, y, maxX, maxY);
    return element;
  } else {
    const size = randomInt(IMAGE_MAX, IMAGE_MIN);
    const element = new RectElement(`${id}`);
    element.color = randomColor();
    element.setBound(x, y, size, size);
    return element;
  }
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
