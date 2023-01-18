import { Workspace } from '@blocksuite/store';
import { SurfaceContainer, bindWheelEvents, Bound } from '@blocksuite/phasor';

const { Y } = Workspace;

function main() {
  const doc = new Y.Doc();
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const yContainer = doc.getMap('container');
  const container = new SurfaceContainer(canvas, yContainer);

  bindWheelEvents(container.renderer, canvas);

  container.addDebugElement(new Bound(0, 0, 100, 100), 'red');

  container.addDebugElement(new Bound(50, 50, 100, 100), 'black');

  // @ts-ignore
  window.container = container;
}

main();
