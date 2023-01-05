import { Renderer } from '@blocksuite/phasor';
import { bindWheelEvents, initMockData } from './utils';

function main() {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const renderer = new Renderer(canvas);

  bindWheelEvents(renderer);
  initMockData(renderer, 100, 500, 500);
}

main();
