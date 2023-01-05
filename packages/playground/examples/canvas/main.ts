import { Renderer, bindWheelEvents, initMockData } from '@blocksuite/phasor';

function main() {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const renderer = new Renderer(canvas);

  bindWheelEvents(renderer, canvas);
  initMockData(renderer, 100, 500, 500);
}

main();
