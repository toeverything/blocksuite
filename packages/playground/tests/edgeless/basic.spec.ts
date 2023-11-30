// eslint-disable-next-line @typescript-eslint/no-restricted-imports

import { afterEach, beforeEach, expect, test } from 'vitest';

import { cleanup, setupEditor } from '../utils/setup';

beforeEach(async () => {
  await setupEditor('edgeless');
});

afterEach(() => {
  cleanup();
});

test('basic', () => {
  expect(window.page).toBeDefined();
  expect(window.editor).toBeDefined();
  expect(window.editor.mode).toBe('edgeless');
});
