// Test page entry located in playground/examples/blob/index.html
import { BlobStorage, IndexedDBBlobProvider } from '..';
import {
  test,
  collectTestResult,
  loadTestImageBlob,
  loadImage,
  assertColor,
} from './test-utils';

export function main() {
  test('can init provider', async () => {
    const storage = new BlobStorage();
    const provider = new IndexedDBBlobProvider();
    storage.addProvider(provider);
    return storage !== null;
  });

  test('can store image', async () => {
    const storage = new BlobStorage();
    const provider = new IndexedDBBlobProvider();
    storage.addProvider(provider);

    const blob = await loadTestImageBlob('test-card-1');
    const id = await storage.set(blob);
    const url = await storage.get(id);

    const img = await loadImage(url);
    // for debug
    document.body.appendChild(img);

    const isCorrectColor = assertColor(img, 100, 100, [128, 128, 128]);
    return url.startsWith('blob:') && isCorrectColor;
  });

  collectTestResult();
}

// @ts-ignore
window.main = main;
