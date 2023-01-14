import { Workspace } from '@blocksuite/store';
import {
  SurfaceContainer,
  bindWheelEvents,
  RectElement,
} from '@blocksuite/phasor';

const { Y } = Workspace;

function main() {
  const doc = new Y.Doc();
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const yContainer = doc.getMap('container');
  const container = new SurfaceContainer(canvas, yContainer);

  bindWheelEvents(container.renderer, canvas);

  const element0 = new RectElement('0', '0');
  element0.setBound(0, 0, 100, 100);
  element0.color = 'red';
  container.addElement(element0);

  // const bound = { x: 100, y: 100, w: 100, h: 100 };
  // container.setElementBound(element0.id, bound);

  container.removeElement(element0.id);

  // const element1 = new RectElement('1', '1');
  // element1.setBound(100, 100, 100, 100);
  // container.addElement(element1);

  // @ts-ignore
  window.container = container;
}

main();
