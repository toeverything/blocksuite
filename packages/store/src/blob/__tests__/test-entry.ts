// Test page entry located in playground/examples/blob/index.html
import { BlobStorage, IndexedDBBlobProvider } from '..';
import { test, collectTestResult } from './test-utils';

export async function main() {
  test('can init provider', async () => {
    const storage = new BlobStorage();
    const provider = new IndexedDBBlobProvider();
    storage.addProvider(provider);
    return storage !== null;
  });

  collectTestResult();
}

// @ts-ignore
window.main = main;
