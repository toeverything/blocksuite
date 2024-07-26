import { setEdgelessTool, switchEditorMode } from 'utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
} from 'utils/actions/misc.js';

import { test } from '../utils/playwright.js';

// Shapes: `fillColor`, `strokeColor` and `color`
test.describe('shapes', () => {
  test('', async ({ page }) => {
    await enterPlaygroundRoom(page, {
      flags: {
        enable_color_picker: true,
      },
    });
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await setEdgelessTool(page, 'shape');
  });
});

// Connectors: `stroke` and `labelStyle`

// Brush: `color`

// Text: `color`

// Notes: `background`

// Frames: `background`
