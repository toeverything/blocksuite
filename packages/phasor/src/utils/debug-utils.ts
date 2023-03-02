import { DebugElement, type PhasorElement } from '../elements/index.js';
import { setXYWH } from '../index.js';
import type { SurfaceManager } from '../surface.js';

const DEBUG_ELEMENT_MAX = 150;
const DEBUG_ELEMENT_MIN = 120;

function randomInt(range: number, min = 0) {
  return Math.floor(Math.random() * (range - min)) + min;
}

function randomColor() {
  return '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
}

function createMockElement(id: number, rangeX: number, rangeY: number) {
  const x = randomInt(rangeX);
  const y = randomInt(rangeY);

  const size = randomInt(DEBUG_ELEMENT_MAX, DEBUG_ELEMENT_MIN);
  const element = new DebugElement(`${id}`);
  element.color = randomColor();
  setXYWH(element, { x, y, w: size, h: size });

  return element;
}

export function initMockData(
  surface: SurfaceManager,
  count: number,
  rangeX: number,
  rangeY: number
) {
  const elements: PhasorElement[] = [];
  for (let i = 0; i < count; i++) {
    const element = createMockElement(i, rangeX, rangeY);
    elements.push(element);
  }
  surface.addElements(elements);
}
