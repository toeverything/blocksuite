import { Workspace } from '@blocksuite/store';
import {
  SurfaceManager,
  Bound,
  DebugElement,
  // Uncomment to batch load mock data
  // initMockData,
} from '@blocksuite/phasor';

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

  // Uncomment to batch load mock data
  // initMockData(surface, 100, 1000, 1000);

  surface.initDefaultGestureHandler();
  canvas.addEventListener('click', e => testClick(surface, e));

  // @ts-ignore
  window.surface = surface;
}

main();
