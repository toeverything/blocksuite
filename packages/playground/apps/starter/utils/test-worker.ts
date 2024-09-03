// This file is used to test blocksuite can run in a web worker. SEE: tests/worker.spec.ts

import '@blocksuite/store';
// import '@blocksuite/block-std'; // seems not working
import '@blocksuite/blocks/schemas';

globalThis.onmessage = event => {
  const { data } = event;
  if (data === 'ping') {
    postMessage('pong');
  }
};
