import {
  Bound,
  DebugElement,
  SurfaceManager,
  // Uncomment to batch load mock data
  // initMockData,
} from '@blocksuite/phasor';
import { Workspace } from '@blocksuite/store';

import { ViewportState } from './viewport-state.js';
import { initWheelEventHandlers } from './wheel-event-handlers';

const { Y } = Workspace;

function testClick(surface: SurfaceManager, e: MouseEvent) {
  const [modelX, modelY] = surface.toModelCoord(e.offsetX, e.offsetY);
  const elements = surface.pick(modelX, modelY);
  const topElement = surface.pickTop(modelX, modelY);
  console.log(
    'picked elements count',
    elements.length,
    'top element color',
    (topElement as DebugElement)?.color
  );
}

const hoverRect = document.querySelector('#hover-rect') as HTMLDivElement;
function mouseMove(
  surface: SurfaceManager,
  viewportState: ViewportState,
  e: MouseEvent
) {
  const [modelX, modelY] = surface.toModelCoord(e.offsetX, e.offsetY);
  const topElement = surface.pickTop(modelX, modelY);

  if (topElement) {
    const [x, y] = surface.toViewCoord(topElement.x, topElement.y);

    hoverRect.style.visibility = 'visible';
    hoverRect.style.left = `${x}px`;
    hoverRect.style.top = `${y}px`;
    hoverRect.style.width = `${topElement.w * viewportState.zoom}px`;
    hoverRect.style.height = `${topElement.h * viewportState.zoom}px`;
  } else {
    hoverRect.style.visibility = 'hidden';
  }
}

function main() {
  const doc = new Y.Doc();
  const yContainer = doc.getMap('container');

  const canvas = document.querySelector('canvas') as HTMLCanvasElement;

  const viewportState = new ViewportState();
  const bound = canvas.getBoundingClientRect();
  viewportState.setSize(bound.width, bound.height);
  viewportState.setCenter(0, 0);

  const surface = new SurfaceManager(canvas, yContainer);

  initWheelEventHandlers(surface, viewportState, canvas);
  surface.setViewport(
    viewportState.centerX,
    viewportState.centerY,
    viewportState.zoom
  );

  surface.addDebugElement(new Bound(0, 0, 100, 100), 'red');
  surface.addDebugElement(new Bound(50, 50, 100, 100), 'black');
  surface.addDebugElement(new Bound(298, 0, 2, 300), 'gray');

  surface.addBrushElement([300, 120], 'green', [
    [0, 0],
    [0, 100],
    [20, 20],
    [40, 120],
    [100, 60],
    [180, 10],
  ]);
  surface.addBrushElement([300, 10], 'blue');
  const brushId = surface.addBrushElement([300, 20], 'purple');
  surface.updateBrushElementPoints(brushId, [
    [0, 0],
    [10, 20],
    [30, 65],
    [15, 40],
  ]);

  // Uncomment to batch load mock data
  // initMockData(surface, 100, 1000, 1000);

  surface.initDefaultGestureHandler();
  canvas.addEventListener('click', e => testClick(surface, e));
  canvas.addEventListener('mousemove', e =>
    mouseMove(surface, viewportState, e)
  );
  canvas.addEventListener('wheel', e => mouseMove(surface, viewportState, e));

  // @ts-ignore
  window.surface = surface;
}

main();
