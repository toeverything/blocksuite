import { afterEach, beforeEach, expect, test } from 'vitest';

import { getSurface } from '../utils/edgeless.js';
import { cleanup, setupEditor } from '../utils/setup.js';

beforeEach(async () => {
  await setupEditor('edgeless');
});

afterEach(() => {
  cleanup();
});

test('basic assert', () => {
  expect(window.page).toBeDefined();
  expect(window.editor).toBeDefined();
  expect(window.editor.mode).toBe('edgeless');

  expect(getSurface(window.page, window.editor)).toBeDefined();
});
