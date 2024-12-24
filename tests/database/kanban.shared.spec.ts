import { portableLocator } from 'utils/query.js';

import {
  enterPlaygroundRoom,
  initKanbanViewState,
} from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';
import { focusKanbanCardHeader } from './actions.js';

test.describe('kanban view', () => {
  test('drag and drop', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initKanbanViewState(page, {
      rows: ['row1'],
      columns: [
        {
          type: 'number',
          value: [1],
        },
        {
          type: 'rich-text',
          value: ['text'],
        },
      ],
    });

    await focusKanbanCardHeader(page);
    // https://playwright.dev/docs/input#dragging-manually mentions that you may need two drags to
    // trigger `dragover`, so we drag to our own column header before dragging to "Ungroups".
    await portableLocator(page, 'affine-data-view-kanban-card').hover();
    await page.mouse.down();
    await page.locator('[data-wc-dnd-drag-handler-id="g:0"]').hover();
    await page
      .locator('[data-wc-dnd-drag-handler-id="Ungroups"]')
      .hover({ force: true });
    await page.mouse.up();

    // When we drag into "Ungroups", our old group collapses.
    await test
      .expect(page.locator('[data-wc-dnd-drag-handler-id="g:0"]'))
      .not.toBeVisible();
  });
});
