/* eslint-disable @typescript-eslint/no-explicit-any */
// Test page entry located in playground/examples/blob/index.html
import { BlobStorage, IndexedDBBlobProvider } from '..';
import {
  testSerial,
  run,
  loadTestImageBlob,
  loadImage,
  assertColor,
  assertExists,
} from './test-utils';

export async function testBasic() {
  const storage = new BlobStorage();
  const provider = new IndexedDBBlobProvider();
  storage.addProvider(provider);

  const blob = await loadTestImageBlob('test-card-1');
  const id = await storage.set(blob);

  // @ts-ignore
  window.storage = storage;

  testSerial('can init provider', async () => {
    return storage !== null;
  });

  testSerial('can store image', async () => {
    const url = await storage.get(id);
    assertExists(url);

    const img = await loadImage(url);
    // for debug
    document.body.appendChild(img);

    const isCorrectColor = assertColor(img, 100, 100, [128, 128, 128]);
    return url.startsWith('blob:') && isCorrectColor;
  });

  testSerial('can delete image', async () => {
    await storage.delete(id);
    const url = await storage.get(id);
    return url === null;
  });

  testSerial('can clear storage', async () => {
    const id = await storage.set(blob);
    const url = await storage.get(id);
    assertExists(url);

    await storage.clear();
    const result = await storage.get(id);
    return result === null;
  });

  await run();
}

(window as any).main = () => {
  testBasic();
};
(window as any).testBasic = testBasic;
