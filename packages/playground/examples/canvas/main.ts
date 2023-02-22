import {
  Bound,
  DebugElement,
  SurfaceManager,
  // Uncomment to batch load mock data
  // initMockData,
} from '@blocksuite/phasor';
import { Workspace } from '@blocksuite/store';

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

function main() {
  const doc = new Y.Doc();
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const yContainer = doc.getMap('container');
  const surface = new SurfaceManager(canvas, yContainer);

  surface.addDebugElement(new Bound(0, 0, 100, 100), 'red');
  surface.addDebugElement(new Bound(50, 50, 100, 100), 'black');
  surface.addShapeElement(new Bound(200, 0, 100, 100), 'rect', 'black');
  surface.addShapeElement(new Bound(200, 110, 100, 100), 'triangle', 'black');
  surface.addShapeElement(new Bound(200, 220, 210, 100), 'ellipse', 'black');
  surface.addShapeElement(new Bound(310, 0, 100, 100), 'diamond', 'black');
  surface.addShapeElement(
    new Bound(310, 110, 100, 100),
    'roundedRect',
    'black'
  );

  // Uncomment to batch load mock data
  // initMockData(surface, 100, 1000, 1000);

  surface.initDefaultGestureHandler();
  canvas.addEventListener('click', e => testClick(surface, e));

  // @ts-ignore
  window.surface = surface;
}

main();
