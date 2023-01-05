import { PathModel, ImageModel, type Model } from '@blocksuite/phasor';
import type { Renderer } from '@blocksuite/phasor';

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

function createMockModel(id: number, rangeX: number, rangeY: number) {
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
    const model = new PathModel(id, points);
    model.color = randomColor();
    model.setBound(x, y, maxX, maxY);
    return model;
  } else {
    const size = randomInt(IMAGE_MAX, IMAGE_MIN);
    const model = new ImageModel(id, 0);
    model.setBound(x, y, size, size);
    return model;
  }
}

export function initMockData(
  renderer: Renderer,
  count: number,
  rangeX: number,
  rangeY: number
) {
  const models: Model[] = [];
  for (let i = 0; i < count; i++) {
    const model = createMockModel(i, rangeX, rangeY);
    models.push(model);
  }
  renderer.load(models);
}

export function bindWheelEvents(renderer: Renderer) {
  renderer.canvas.addEventListener('wheel', e => {
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
