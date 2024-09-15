import type { Page } from '@playwright/test';

import { clickView } from 'utils/actions/click.js';
import {
  dragBetweenViewCoords as _dragBetweenViewCoords,
  createFrame,
  edgelessCommonSetup,
  getSelectedBound,
  toViewCoord,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import { pressEscape, selectAllByKeyboard } from 'utils/actions/keyboard.js';
import { waitNextFrame } from 'utils/actions/misc.js';
import { assertSelectedBound } from 'utils/asserts.js';

import { test } from '../../utils/playwright.js';

const dragBetweenViewCoords = async (
  page: Page,
  start: number[],
  end: number[]
) => {
  // dragging slowly may drop frame if mindmap is existed, so for test we drag quickly
  await _dragBetweenViewCoords(page, start, end, { steps: 2 });
  await waitNextFrame(page);
};

test.beforeEach(async ({ page }) => {
  await edgelessCommonSetup(page);
  await zoomResetByKeyboard(page);
});

test('drag root node of mindmap into frame partially, move frame, then drag root node of mindmap out.', async ({
  page,
}) => {
  await createFrame(page, [50, 50], [550, 550]);
  await pressEscape(page);
  await triggerComponentToolbarAction(page, 'addMindmap');

  let mindmapBound = await getSelectedBound(page);

  // drag in
  {
    await clickView(page, [
      mindmapBound[0] + 10,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] + 10, mindmapBound[1] + 0.5 * mindmapBound[3]],
      [100, 100]
    );
    await pressEscape(page);
    await selectAllByKeyboard(page);
    mindmapBound = await getSelectedBound(page, 0);
    await pressEscape(page);
  }

  // Drag frame
  {
    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [60, 60], [110, 110]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(
    page,
    [
      mindmapBound[0] + 50,
      mindmapBound[1] + 50,
      mindmapBound[2],
      mindmapBound[3],
    ],
    0
  ); // mindmap
  await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame

  // drag out
  {
    mindmapBound = await getSelectedBound(page, 0);
    pressEscape(page);
    await clickView(page, [
      mindmapBound[0] + 10,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] + 10, mindmapBound[1] + 0.5 * mindmapBound[3]],
      [-100, -100]
    );
    await pressEscape(page);
    await selectAllByKeyboard(page);
    mindmapBound = await getSelectedBound(page, 0);
    await pressEscape(page);
  }

  // drag frame
  {
    await clickView(page, [110, 110]);
    await dragBetweenViewCoords(page, [110, 110], [160, 160]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, mindmapBound, 0); // mindmap
  await assertSelectedBound(page, [150, 150, 500, 500], 1); // frame
});

test('drag root node of mindmap into frame fully, move frame, then drag root node of mindmap out.', async ({
  page,
}) => {
  await createFrame(page, [50, 50], [550, 550]);
  await pressEscape(page);
  await triggerComponentToolbarAction(page, 'addMindmap');

  let mindmapBound = await getSelectedBound(page);

  // drag in
  {
    await clickView(page, [
      mindmapBound[0] + 10,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] + 10, mindmapBound[1] + 0.5 * mindmapBound[3]],
      [100, 200]
    );
    await pressEscape(page);
    await selectAllByKeyboard(page);
    mindmapBound = await getSelectedBound(page, 0);
    await pressEscape(page);
  }

  // Drag frame
  {
    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [60, 60], [110, 110]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(
    page,
    [
      mindmapBound[0] + 50,
      mindmapBound[1] + 50,
      mindmapBound[2],
      mindmapBound[3],
    ],
    0
  ); // mindmap
  await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame

  // drag out
  {
    mindmapBound = await getSelectedBound(page, 0);
    pressEscape(page);
    await clickView(page, [
      mindmapBound[0] + 10,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] + 10, mindmapBound[1] + 0.5 * mindmapBound[3]],
      [-100, -100]
    );
    await pressEscape(page);
    await selectAllByKeyboard(page);
    mindmapBound = await getSelectedBound(page, 0);
    await pressEscape(page);
  }

  // drag frame
  {
    await clickView(page, [110, 110]);
    await dragBetweenViewCoords(page, [110, 110], [160, 160]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, mindmapBound, 0); // mindmap
  await assertSelectedBound(page, [150, 150, 500, 500], 1); // frame
});

test('drag whole mindmap into frame, move frame, then drag root node of mindmap out.', async ({
  page,
}) => {
  await createFrame(page, [50, 50], [550, 550]);
  await pressEscape(page);
  await triggerComponentToolbarAction(page, 'addMindmap');

  let mindmapBound = await getSelectedBound(page);

  // drag in
  {
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] - 10, mindmapBound[1] - 10],
      [mindmapBound[0] + 10, mindmapBound[1] + 10]
    );
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] + 10, mindmapBound[1] + 10],
      [100, 100]
    );
    await pressEscape(page);
    await selectAllByKeyboard(page);
    mindmapBound = await getSelectedBound(page, 0);
    await pressEscape(page);
  }

  // Drag frame
  {
    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [60, 60], [110, 110]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(
    page,
    [
      mindmapBound[0] + 50,
      mindmapBound[1] + 50,
      mindmapBound[2],
      mindmapBound[3],
    ],
    0
  ); // mindmap
  await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame

  // drag out
  {
    mindmapBound = await getSelectedBound(page, 0);
    pressEscape(page);
    await clickView(page, [
      mindmapBound[0] + 10,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await dragBetweenViewCoords(
      page,
      [mindmapBound[0] + 10, mindmapBound[1] + 0.5 * mindmapBound[3]],
      [0, 0]
    );
    await pressEscape(page);
    await selectAllByKeyboard(page);
    mindmapBound = await getSelectedBound(page, 0);
    await pressEscape(page);
  }

  // drag frame
  {
    await clickView(page, [110, 110]);
    await dragBetweenViewCoords(page, [110, 110], [160, 160]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, mindmapBound, 0); // mindmap
  await assertSelectedBound(page, [150, 150, 500, 500], 1); // frame
});

// FIXME(@L-Sun): This test is flaky
test.fixme(
  'add partial mindmap into frame, move frame, then drag root node of mindmap out.',
  async ({ page }) => {
    await createFrame(page, [50, 50], [550, 550]);
    await pressEscape(page);

    const button = page.locator('edgeless-mindmap-tool-button');
    await button.click();
    await toViewCoord(page, [100, 200]);
    await clickView(page, [100, 200]);

    let mindmapBound = await getSelectedBound(page);

    // Drag frame
    {
      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);
    }

    await selectAllByKeyboard(page);
    await assertSelectedBound(
      page,
      [
        mindmapBound[0] + 50,
        mindmapBound[1] + 50,
        mindmapBound[2],
        mindmapBound[3],
      ],
      0
    ); // mindmap
    await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame

    // drag out
    {
      mindmapBound = await getSelectedBound(page, 0);
      pressEscape(page);
      await clickView(page, [
        mindmapBound[0] + 10,
        mindmapBound[1] + 0.5 * mindmapBound[3],
      ]);
      await dragBetweenViewCoords(
        page,
        [mindmapBound[0] + 10, mindmapBound[1] + 0.5 * mindmapBound[3]],
        [-20, -20]
      );
      await pressEscape(page);
      await selectAllByKeyboard(page);
      mindmapBound = await getSelectedBound(page, 0);
      await pressEscape(page);
    }

    // drag frame
    {
      await clickView(page, [110, 110]);
      await dragBetweenViewCoords(page, [110, 110], [160, 160]);
      await pressEscape(page);
    }

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, mindmapBound, 0); // mindmap
    await assertSelectedBound(page, [150, 150, 500, 500], 1); // frame
  }
);

test('add mindmap out of frame and add new node in frame then drag frame', async ({
  page,
}) => {
  await createFrame(page, [500, 50], [1000, 550]);
  await pressEscape(page);

  const button = page.locator('edgeless-mindmap-tool-button');
  await button.click();
  await toViewCoord(page, [20, 200]);
  await clickView(page, [20, 200]);
  await waitNextFrame(page, 100);
  let mindmapBound = await getSelectedBound(page);

  // add new node
  {
    await pressEscape(page);
    await waitNextFrame(page, 500);
    await clickView(page, [
      mindmapBound[2] - 50,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await waitNextFrame(page, 500);
    await clickView(page, [
      mindmapBound[2] + 10,
      mindmapBound[1] + 0.5 * mindmapBound[3],
    ]);
    await pressEscape(page, 2);
  }

  await selectAllByKeyboard(page);
  mindmapBound = await getSelectedBound(page, 0);
  await pressEscape(page, 2);
  await waitNextFrame(page, 100);

  // Drag frame
  {
    await clickView(page, [510, 60]);
    await dragBetweenViewCoords(page, [510, 60], [560, 110]);
  }

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, mindmapBound, 0); // mindmap
  await assertSelectedBound(page, [550, 100, 500, 500], 1); // frame
});
