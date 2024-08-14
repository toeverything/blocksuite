import { sleep } from '@global/utils.js';
import { type Page, expect } from '@playwright/test';
import { switchEditorMode } from 'utils/actions/edgeless.js';

import { dragBlockToPoint, popImageMoreMenu } from './utils/actions/drag.js';
import {
  SHORT_KEY,
  pressArrowDown,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressEscape,
  pressShiftTab,
  pressTab,
  redoByKeyboard,
  type,
  undoByKeyboard,
} from './utils/actions/keyboard.js';
import {
  captureHistory,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  resetHistory,
  waitNextFrame,
} from './utils/actions/misc.js';
import {
  assertBlockChildrenIds,
  assertBlockCount,
  assertBlockFlavour,
  assertBlockSelections,
  assertKeyboardWorkInInput,
  assertParentBlockFlavour,
  assertRichImage,
  assertRichTextInlineRange,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

const FILE_NAME = 'test-card-1.png';
const FILE_PATH = `packages/playground/public/${FILE_NAME}`;
const FILE_ID = 'ejImogf-Tb7AuKY-v94uz1zuOJbClqK-tWBxVr_ksGA=';
const FILE_SIZE = 45801;

function getAttachment(page: Page) {
  const attachment = page.locator('affine-attachment');
  const loading = attachment.locator('.affine-attachment-card.loading');
  const toolbar = page.locator('.affine-attachment-toolbar');
  const switchViewButton = toolbar.getByRole('button', { name: 'Switch view' });
  const renameBtn = toolbar.getByRole('button', { name: 'Rename' });
  const renameInput = page.locator('.affine-attachment-rename-container input');

  const insertAttachment = async () => {
    await page.evaluate(() => {
      // Force fallback to input[type=file] in tests
      // See https://github.com/microsoft/playwright/issues/8850
      window.showOpenFilePicker = undefined;
    });

    const slashMenu = page.locator(`.slash-menu`);
    await waitNextFrame(page);
    await type(page, '/');
    await resetHistory(page);
    await expect(slashMenu).toBeVisible();
    await type(page, 'file', 100);
    await expect(slashMenu).toBeVisible();

    const fileChooser = page.waitForEvent('filechooser');
    await pressEnter(page);
    await sleep(100);
    await (await fileChooser).setFiles(FILE_PATH);

    // Try to break the undo redo test
    await captureHistory(page);

    await expect(attachment).toBeVisible();
  };

  const getName = () =>
    attachment.locator('.affine-attachment-content-title-text').innerText();

  return {
    // locators
    attachment,
    toolbar,
    switchViewButton,
    renameBtn,
    renameInput,

    // actions
    insertAttachment,
    /**
     * Wait for the attachment upload to finish
     */
    waitLoading: () => loading.waitFor({ state: 'hidden' }),
    getName,
    getSize: () =>
      attachment.locator('.affine-attachment-content-info').innerText(),

    turnToEmbed: async () => {
      await expect(switchViewButton).toBeVisible();
      await switchViewButton.click();
      await page.getByRole('button', { name: 'Embed view' }).click();
      await assertRichImage(page, 1);
    },
    rename: async (newName: string) => {
      await attachment.hover();
      await expect(toolbar).toBeVisible();
      await renameBtn.click();
      await page.keyboard.press(`${SHORT_KEY}+a`, { delay: 50 });
      await pressBackspace(page);
      await type(page, newName);
      await pressEnter(page);
      expect(await getName()).toContain(newName);
    },

    // external
    turnImageToCard: async () => {
      const { turnIntoCardButton } = await popImageMoreMenu(page);
      await turnIntoCardButton.click();
      await expect(attachment).toBeVisible();
    },
  };
}

test('can insert attachment from slash menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  const { insertAttachment, waitLoading, getName, getSize } =
    getAttachment(page);

  await focusRichText(page);
  await insertAttachment();

  // Wait for the attachment to be uploaded
  await waitLoading();

  expect(await getName()).toBe(FILE_NAME);
  expect(await getSize()).toBe('45.8 kB');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:embed={false}
    prop:index="a0"
    prop:name="${FILE_NAME}"
    prop:rotate={0}
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:style="horizontalThin"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );
});

test('should undo/redo works for attachment', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  const { insertAttachment, waitLoading } = getAttachment(page);

  await focusRichText(page);
  await insertAttachment();

  // Wait for the attachment to be uploaded
  await waitLoading();

  await assertStoreMatchJSX(
    page,
    `  <affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:embed={false}
    prop:index="a0"
    prop:name="${FILE_NAME}"
    prop:rotate={0}
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:style="horizontalThin"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );

  await undoByKeyboard(page);
  await waitNextFrame(page);
  // The loading/error state should not be restored after undo
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="/"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await redoByKeyboard(page);
  await waitNextFrame(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:embed={false}
    prop:index="a0"
    prop:name="${FILE_NAME}"
    prop:rotate={0}
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:style="horizontalThin"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );
});

test('should rename attachment works', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/4534',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const {
    attachment,
    renameBtn,
    renameInput,
    insertAttachment,
    waitLoading,
    getName,
    rename,
  } = getAttachment(page);

  await focusRichText(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  expect(await getName()).toBe(FILE_NAME);

  await attachment.hover();
  await expect(renameBtn).toBeVisible();
  await renameBtn.click();
  await assertKeyboardWorkInInput(page, renameInput);
  await pressEscape(page);
  await expect(renameInput).not.toBeVisible();

  await rename('new-name');
  expect(await getName()).toBe('new-name.png');
  await rename('');
  expect(await getName()).toBe('.png');
  await rename('abc');
  expect(await getName()).toBe('abc');
});

test('should turn attachment to image works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  const { insertAttachment, waitLoading, turnToEmbed, turnImageToCard } =
    getAttachment(page);

  await focusRichText(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  await turnToEmbed();

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:image
    prop:caption=""
    prop:height={0}
    prop:index="a0"
    prop:rotate={0}
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:width={0}
  />
</affine:note>`,
    noteId
  );
  await turnImageToCard();
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:caption=""
    prop:embed={false}
    prop:index="a0"
    prop:name="${FILE_NAME}"
    prop:rotate={0}
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:style="horizontalThin"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );
});

test('should attachment can be deleted', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  const { attachment, insertAttachment, waitLoading } = getAttachment(page);

  await focusRichText(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  await attachment.click();
  await pressBackspace(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test(`support dragging attachment block directly`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  const { insertAttachment, waitLoading, getName, getSize } =
    getAttachment(page);

  await focusRichText(page);
  await insertAttachment();

  // Wait for the attachment to be uploaded
  await waitLoading();

  expect(await getName()).toBe(FILE_NAME);
  expect(await getSize()).toBe('45.8 kB');

  await assertStoreMatchJSX(
    page,
    `  <affine:note
  prop:background="--affine-note-background-blue"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 0,
        "borderSize": 4,
        "borderStyle": "none",
        "shadowType": "--affine-note-shadow-sticker",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:embed={false}
    prop:index="a0"
    prop:name="${FILE_NAME}"
    prop:rotate={0}
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:style="horizontalThin"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );

  const attachmentBlock = page.locator('affine-attachment');
  const rect = await attachmentBlock.boundingBox();
  if (!rect) {
    throw new Error('image not found');
  }

  // add new paragraph blocks
  await page.mouse.click(rect.x + 20, rect.y + rect.height + 20);
  await focusRichText(page);
  await type(page, '111');
  await page.waitForTimeout(200);
  await pressEnter(page);

  await type(page, '222');
  await page.waitForTimeout(200);
  await pressEnter(page);

  await type(page, '333');
  await page.waitForTimeout(200);

  await page.waitForTimeout(200);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:attachment
      prop:embed={false}
      prop:index="a0"
      prop:name="${FILE_NAME}"
      prop:rotate={0}
      prop:size={${FILE_SIZE}}
      prop:sourceId="${FILE_ID}"
      prop:style="horizontalThin"
      prop:type="image/png"
    />
    <affine:paragraph
      prop:text="111"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="222"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="333"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );

  // drag bookmark block
  await page.mouse.move(rect.x + 20, rect.y + 20);
  await page.mouse.down();
  await page.mouse.move(rect.x + 40, rect.y + rect.height + 80, { steps: 20 });
  await page.mouse.up();

  const rects = page.locator('affine-block-selection').locator('visible=true');
  await expect(rects).toHaveCount(1);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="111"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="222"
      prop:type="text"
    />
    <affine:attachment
      prop:embed={false}
      prop:index="a0"
      prop:name="${FILE_NAME}"
      prop:rotate={0}
      prop:size={${FILE_SIZE}}
      prop:sourceId="${FILE_ID}"
      prop:style="horizontalThin"
      prop:type="image/png"
    />
    <affine:paragraph
      prop:text="333"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test('press backspace after bookmark block can select bookmark block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const { insertAttachment, waitLoading } = getAttachment(page);

  await focusRichText(page);
  await pressEnter(page);
  await pressArrowUp(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  await focusRichText(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTextInlineRange(page, 0, 0);
  await pressBackspace(page);
  await assertBlockSelections(page, ['4']);
  await assertBlockCount(page, 'paragraph', 0);
});

test('cancel file picker with input element resolves', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  const { attachment } = getAttachment(page);

  await focusRichText(page);
  await pressEnter(page);
  await pressArrowUp(page);

  await page.evaluate(() => {
    // Force fallback to input[type=file]
    window.showOpenFilePicker = undefined;
  });

  const slashMenu = page.locator(`.slash-menu`);
  await waitNextFrame(page);
  await type(page, '/file', 100);
  await expect(slashMenu).toBeVisible();

  const fileChooser = page.waitForEvent('filechooser');
  await pressEnter(page);
  const inputFile = page.locator("input[type='file']");
  await expect(inputFile).toHaveCount(1);

  // This does not trigger `cancel` event and,
  // therefore, the test isn't representative.
  // Waiting for https://github.com/microsoft/playwright/issues/27524
  await (await fileChooser).setFiles([]);

  await expect(attachment).toHaveCount(0);
  await expect(inputFile).toHaveCount(0);
});

test('indent attachment block to paragraph', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const { insertAttachment, waitLoading } = getAttachment(page);

  await focusRichText(page);
  await pressEnter(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  await assertBlockChildrenIds(page, '1', ['2', '4']);
  await assertBlockFlavour(page, '1', 'affine:note');
  await assertBlockFlavour(page, '2', 'affine:paragraph');
  await assertBlockFlavour(page, '4', 'affine:attachment');

  await focusRichText(page);
  await pressArrowDown(page);
  await assertBlockSelections(page, ['4']);
  await pressTab(page);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['4']);

  await pressShiftTab(page);
  await assertBlockChildrenIds(page, '1', ['2', '4']);
});

test('indent attachment block to list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const { insertAttachment, waitLoading } = getAttachment(page);

  await focusRichText(page);
  await type(page, '- a');
  await pressEnter(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  await assertBlockChildrenIds(page, '1', ['3', '5']);
  await assertBlockFlavour(page, '1', 'affine:note');
  await assertBlockFlavour(page, '3', 'affine:list');
  await assertBlockFlavour(page, '5', 'affine:attachment');

  await focusRichText(page);
  await pressArrowDown(page);
  await assertBlockSelections(page, ['5']);
  await pressTab(page);
  await assertBlockChildrenIds(page, '1', ['3']);
  await assertBlockChildrenIds(page, '3', ['5']);

  await pressShiftTab(page);
  await assertBlockChildrenIds(page, '1', ['3', '5']);
});

test('attachment can be dragged from note to surface top level block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  const { insertAttachment, waitLoading } = getAttachment(page);

  await focusRichText(page);
  await insertAttachment();

  // Wait for the attachment to be uploaded
  await waitLoading();

  await switchEditorMode(page);
  await page.mouse.dblclick(450, 450);

  await dragBlockToPoint(page, '4', { x: 200, y: 200 });

  await waitNextFrame(page);
  await assertParentBlockFlavour(page, '5', 'affine:surface');
});
