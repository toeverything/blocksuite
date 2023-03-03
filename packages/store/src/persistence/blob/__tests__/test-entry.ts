// Test page entry located in playground/examples/blob/index.html
import {
  assertColor,
  assertExists,
  disableButtonsAfterClick,
  loadImage,
  loadTestImageBlob,
  runOnce,
  testSerial,
} from '../../../__tests__/test-utils-dom.js';
import { getBlobStorage } from '../index.js';

const optionsGetters = {
  noop: () => void 0,
  cloudEndpoint: (k: string) => ({ api: '/api/workspace' }[k]),
};

async function testBasic() {
  const storage = await getBlobStorage('test', optionsGetters.noop);
  assertExists(storage);

  const blob = await loadTestImageBlob('test-card-1');
  let id: string | undefined = undefined;

  // @ts-ignore
  window.storage = storage;

  testSerial('can init provider', async () => {
    return storage !== null;
  });

  testSerial('can store image', async () => {
    id = await storage.set(blob);
    console.log(id);

    const url = await storage.get(id);
    assertExists(url);

    const img = await loadImage(url);
    document.body.appendChild(img);

    const isCorrectColor = assertColor(img, 100, 100, [128, 128, 128]);
    return url.startsWith('blob:') && isCorrectColor;
  });

  testSerial('can trigger event', async () => {
    let called = false;
    let idCalled: string | null = null;

    storage.slots.onBlobSyncStateChange.on(state => {
      called = true;
      idCalled = state.id;
    });

    const blob = await loadTestImageBlob('test-card-2');
    const id = await storage.set(blob);
    const url = await storage.get(id);
    assertExists(url);

    const img = await loadImage(url);
    document.body.appendChild(img);

    return id === idCalled && called;
  });

  testSerial('can delete image', async () => {
    assertExists(id);

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

  const storage = await getBlobStorage('test', optionsGetters.noop);
  assertExists(storage);

  testSerial('can set blob', async () => {
    const blob = await loadTestImageBlob('test-card-2');
    const id = await storage.set(blob);
    const blobs = await storage.blobs;
    return id !== null && blobs.includes(id);
  });

  await runOnce();
}

async function testRefreshAfter() {
  const storage = await getBlobStorage('test', optionsGetters.noop);
  assertExists(storage);

  testSerial('can get saved blob', async () => {
    const blobs = await storage.blobs;
    const id = blobs[0];
    const url = await storage.get(id);
    assertExists(url);

    const img = await loadImage(url);
    document.body.appendChild(img);

    const isCorrectColor = assertColor(img, 100, 100, [193, 193, 193]);
    return blobs.length === 1 && isCorrectColor;
  });

  await runOnce();
  clearIndexedDB();
}

function clearIndexedDB(workspace = 'test') {
  return new Promise<void>(resolve => {
    let count = 2;
    const final = () => {
      count -= 1;
      if (count === 0) {
        resolve();
      }
    };

    const request1 = indexedDB.deleteDatabase(`${workspace}_blob`);
    const request2 = indexedDB.deleteDatabase(`${workspace}_pending`);
    request1.onsuccess = () => {
      console.log(`IndexedDB ${workspace}_blob cleared`);
      final();
    };

    request2.onsuccess = () => {
      console.log(`IndexedDB ${workspace}_pending cleared`);
      final();
    };
  });
}

async function testCloudSyncBefore() {
  await clearIndexedDB('114514');
  const storage = await getBlobStorage('114514', optionsGetters.cloudEndpoint);
  assertExists(storage);

  testSerial('can set blob', async () => {
    const blob = await loadTestImageBlob('test-card-2');
    const id = await storage.set(blob);
    console.log(id);
    const blobs = await storage.blobs;
    const ret = id !== null && blobs.includes(id);

    return ret;
  });

  await runOnce();
  await clearIndexedDB('114514');
}

async function testCloudSyncAfter() {
  const storage = await getBlobStorage('114514', optionsGetters.cloudEndpoint);
  assertExists(storage);

  testSerial('can get saved blob', async () => {
    // the test-card-2's hash
    const url = await storage.get(
      'UYFhfUWakYIN22VrJMmu9-4-VhYOcH830HWVbvZ2LmQ'
    );
    assertExists(url);

    const img = await loadImage(url);
    document.body.appendChild(img);

    const isCorrectColor = assertColor(img, 100, 100, [193, 193, 193]);
    const blobs = await storage.blobs;
    const ret = blobs.length === 1 && isCorrectColor;

    return ret;
  });

  await runOnce();
  await clearIndexedDB('114514');
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
  ?.addEventListener('click', () => clearIndexedDB());
document
  .getElementById('cloud-sync-before')
  ?.addEventListener('click', testCloudSyncBefore);
document
  .getElementById('cloud-sync-after')
  ?.addEventListener('click', testCloudSyncAfter);

disableButtonsAfterClick();
