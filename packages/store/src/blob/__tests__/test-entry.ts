// Test page entry located in playground/examples/blob/index.html
import { BlobStorage, IndexedDBBlobProvider } from '..';
import {
  testSerial,
  runOnce,
  loadTestImageBlob,
  loadImage,
  assertColor,
  assertExists,
  disableButtonsAfterClick,
} from './test-utils';

async function testBasic() {
  const storage = new BlobStorage();
  const provider = await IndexedDBBlobProvider.init();
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

  await runOnce();
  clearIndexedDB();
}

async function testRefreshBefore() {
  clearIndexedDB();
  const storage = new BlobStorage();
  const provider = await IndexedDBBlobProvider.init();
  storage.addProvider(provider);

  testSerial('can set blob', async () => {
    const blob = await loadTestImageBlob('test-card-2');
    const id = await storage.set(blob);
    return id !== null && storage.blobs.has(id);
  });

  await runOnce();
}

async function testRefreshAfter() {
  const storage = new BlobStorage();
  const provider = await IndexedDBBlobProvider.init();
  storage.addProvider(provider);

  testSerial('can get saved blob', async () => {
    const id = storage.blobs.values().next().value;
    const url = await storage.get(id);
    assertExists(url);

    const img = await loadImage(url);
    // for debug
    document.body.appendChild(img);

    const isCorrectColor = assertColor(img, 100, 100, [193, 193, 193]);
    return storage.blobs.size === 1 && isCorrectColor;
  });

  await runOnce();
  clearIndexedDB();
}

function clearIndexedDB() {
  return new Promise<void>(resolve => {
    const request = indexedDB.deleteDatabase('keyval-store');
    request.onsuccess = () => {
      console.log('IndexedDB cleared');
      resolve();
    };
  });
}

document.getElementById('test-basic')?.addEventListener('click', testBasic);
document
  .getElementById('test-refresh-before')
  ?.addEventListener('click', testRefreshBefore);
document
  .getElementById('test-refresh-after')
  ?.addEventListener('click', testRefreshAfter);
document
  .getElementById('clear-indexeddb')
  ?.addEventListener('click', clearIndexedDB);

disableButtonsAfterClick();
