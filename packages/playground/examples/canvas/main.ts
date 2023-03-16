import type { DebugElement } from '@blocksuite/phasor';
import {
  Bound,
  SurfaceManager,
  // Uncomment to batch load mock data
  // initMockData,
} from '@blocksuite/phasor';
import { Workspace } from '@blocksuite/store';

const { Y } = Workspace;

function testClick(surface: SurfaceManager, e: MouseEvent) {
  const [modelX, modelY] = surface.toModelCoord(e.offsetX, e.offsetY);
  // @ts-expect-error
  const elements = surface._pickByPoint(modelX, modelY);
  const topElement = surface.pickTop(modelX, modelY);
  console.log(
    `picked elements count: ${elements.length}, top element type: ${
      topElement?.type
    }, color ${(topElement as DebugElement)?.color}`
  );
}

function addBrushElements(surface: SurfaceManager) {
  surface.addBrushElement(
    { x: 0, y: 0, w: 37.24, h: 18.35 },
    [
      [0, 14.35],
      [0.23, 14.35],
      [0.99, 14.35],
      [3.03, 14.1],
      [4.21, 13.7],
      [5.42, 13.18],
      [6.61, 12.58],
      [10.91, 10.87],
      [17.4, 8.78],
      [21.25, 7.89],
      [25.05, 7.01],
      [28.9, 6.12],
      [33.24, 0],
    ],
    {
      color: '#000000',
      lineWidth: 4,
    }
  );

  const brushId = surface.addBrushElement(
    { x: 0, y: 100, w: 4, h: 4 },
    [[0, 0]],
    {
      color: '#00ff00',
      lineWidth: 4,
    }
  );
  surface.updateBrushElementPoints(brushId, { x: 0, y: 0, w: 104, h: 104 }, [
    [0, 0],
    [10, 10],
    [20, 20],
    [30, 30],
    [40, 40],
    [50, 50],
    [60, 60],
    [70, 70],
    [80, 80],
    [90, 90],
    [100, 100],
  ]);
}

function addShapeElements(surface: SurfaceManager) {
  surface.addShapeElement(new Bound(200, 0, 100, 100), 'rect', {
    filled: true,
    strokeWidth: 0,
    fillColor: '#009900',
  });
  surface.addShapeElement(new Bound(200, 110, 100, 100), 'triangle');
  surface.addShapeElement(new Bound(200, 220, 210, 100), 'ellipse');
  surface.addShapeElement(new Bound(310, 0, 100, 100), 'diamond');
  surface.addShapeElement(new Bound(310, 110, 100, 100), 'rect', {
    radius: 0.1,
    filled: true,
    fillColor: '#009900',
    strokeColor: '#dddd00',
  });
}

function main() {
  const doc = new Y.Doc();
  const container = document.querySelector('#container') as HTMLDivElement;
  const yContainer = doc.getMap('container');
  const surface = new SurfaceManager(yContainer);
  surface.attach(container);

  surface.addDebugElement(new Bound(0, 0, 100, 100), 'red');
  surface.addDebugElement(new Bound(50, 50, 100, 100), 'black');
  surface.addDebugElement(new Bound(298, 0, 2, 300), 'gray');

  addBrushElements(surface);
  addShapeElements(surface);

  // Uncomment to batch load mock data
  // initMockData(surface, 100, 1000, 1000);

  surface.initDefaultGestureHandler();
  container.addEventListener('click', e => testClick(surface, e));

  // @ts-ignore
  window.surface = surface;
}

main();
