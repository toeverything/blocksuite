import { expect, test } from 'vitest';
import { Store } from './store';

test.concurrent('init store', () => {
  const store = new Store();
  expect(store).toBeTruthy();
});
