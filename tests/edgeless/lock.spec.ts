import { edgelessCommonSetup } from 'utils/actions/edgeless.js';

import { test } from '../utils/playwright.js';

test.describe('lock', () => {
  test('edgeless element can be locked and unlocked', async ({ page }) => {
    await edgelessCommonSetup(page);
  });

  test('locked element should be selectable', async ({ page }) => {
    await edgelessCommonSetup(page);
  });

  test('descendant of locked element should not be selectable. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('the selected rect of locked element should contain descendant. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
    // frame
    // mindmap
  });

  test('locked element should be copyable.', async ({ page }) => {
    await edgelessCommonSetup(page);
  });

  test('locked element and descendant should not be draggable and moved by arrow key. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('locked element should be moved if parent is moved', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('locked element should not be scalable and rotatable. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('locked element should not be editable. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);

    // using `Tab` navigate into note to edit
  });

  test('locked element should not be deletable. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);

    // short cut
    // erase
  });

  test('locked frame should not add new child element. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('endpoint of locked connector should not be changeable. unlocking will recover', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('locking multiple elements will create locked group', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });

  test('locking a group should not create a new group', async ({ page }) => {
    await edgelessCommonSetup(page);
  });

  test('unlocking an element should not unlock its locked descendant', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
  });
});
