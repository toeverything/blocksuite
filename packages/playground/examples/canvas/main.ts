import { Workspace } from '@blocksuite/store';
import {
  SurfaceManager,
  bindWheelEvents,
  Bound,
  // initMockData,
} from '@blocksuite/phasor';

const { Y } = Workspace;

function main() {
  const doc = new Y.Doc();
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const yContainer = doc.getMap('container');
  const surface = new SurfaceManager(canvas, yContainer);

  bindWheelEvents(surface.renderer, canvas);

  surface.addDebugElement(new Bound(0, 0, 100, 100), 'red');

  surface.addDebugElement(new Bound(50, 50, 100, 100), 'black');

  // Uncomment to batch load mock data
  // initMockData(container.renderer, 100, 1000, 1000);

  // @ts-ignore
  window.surface = surface;
}

main();
