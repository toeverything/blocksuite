
import {
  enterPlaygroundRoom,
  initKanbanViewState,
} from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';
import {
  focusKanbanCardHeader,
} from './actions.js';

test.describe('kanban view', () => {
  test('basic rendering of kanban card', async ({ page }) => {
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
  });

});
