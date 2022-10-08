import { Page, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  shiftTab,
} from './utils/actions';
import { assertStoreMatchJSX } from './utils/asserts';

const indent = (page: Page) => page.keyboard.press('Tab');
const unindent = shiftTab;

test('basic indent and unindent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('text1');
  await pressEnter(page);
  await page.keyboard.type('text2');

  await assertStoreMatchJSX(
    page,
    `<page>
  <group
    prop:xywh="[0,0,0,0]"
  >
    <paragraph
      prop:text="text1"
      prop:type="text"
    />
    <paragraph
      prop:text="text2"
      prop:type="text"
    />
  </group>
</page>`
  );
  await indent(page);
  await assertStoreMatchJSX(
    page,
    `<page>
  <group
    prop:xywh="[0,0,0,0]"
  >
    <paragraph
      prop:text="text1"
      prop:type="text"
    >
      <paragraph
        prop:text="text2"
        prop:type="text"
      />
    </paragraph>
  </group>
</page>`
  );
  await unindent(page);
  await assertStoreMatchJSX(
    page,
    `<page>
  <group
    prop:xywh="[0,0,0,0]"
  >
    <paragraph
      prop:text="text1"
      prop:type="text"
    />
    <paragraph
      prop:text="text2"
      prop:type="text"
    />
  </group>
</page>`
  );
});
