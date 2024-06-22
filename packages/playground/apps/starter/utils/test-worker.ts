// This file is used to test blocksuite can run in a web worker. SEE: tests/worker.spec.ts

/* eslint-disable @typescript-eslint/no-restricted-imports */

import '@blocksuite/store';
// import '@blocksuite/block-std'; // seems not working
import '@blocksuite/blocks/schemas';

console.log('Worker is running');

globalThis.onmessage = event => {
  console.log('Worker received message:', event.data);
  const { data } = event;
  if (data === 'ping') {
    postMessage('pong');
  }
};
