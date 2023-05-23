import './utils/declare-test-window.js';

import {
  enterPlaygroundRoom,
  focusRichText,
  importMarkdown,
  initEmptyParagraphState,
  resetHistory,
  setVirgoSelection,
} from './utils/actions/index.js';
import { assertStoreValue } from './utils/asserts.js';
import { scoped, test } from './utils/playwright.js';
test(scoped`import notion markdown-format text todo head`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);
  await setVirgoSelection(page, 1, 1);

  const temp = `
  # demo

  text

  - [ ]  todo1
      - [ ]  todo2

  # heading1

  ## heading2

  ### heading3
`;
  const value = {
    '0': {
      'sys:id': '0',
      'sys:flavour': 'affine:page',
      'sys:children': ['1'],
      'prop:title': '',
    },
    '1': {
      'sys:id': '1',
      'sys:flavour': 'affine:frame',
      'sys:children': ['3', '4', '5', '7', '8', '9', '2'],
      'prop:xywh': '[0,0,720,80]',
      'prop:background': '--affine-background-secondary-color',
    },
    '2': {
      'sys:id': '2',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': '',
    },
    '3': {
      'sys:id': '3',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h1',
      'prop:text': 'demo',
    },
    '4': {
      'sys:id': '4',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': '  text',
    },
    '5': {
      'sys:id': '5',
      'sys:flavour': 'affine:list',
      'sys:children': ['6'],
      'prop:type': 'todo',
      'prop:checked': false,
      'prop:text': ' todo1',
    },
    '6': {
      'sys:id': '6',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'todo',
      'prop:checked': false,
      'prop:text': ' todo2',
    },
    '7': {
      'sys:id': '7',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h1',
      'prop:text': 'heading1',
    },
    '8': {
      'sys:id': '8',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h2',
      'prop:text': 'heading2',
    },
    '9': {
      'sys:id': '9',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h3',
      'prop:text': 'heading3',
    },
  };
  await importMarkdown(page, frameId, temp);
  await assertStoreValue(page, 'space:page0', value);
});

test(scoped`import notion markdown-format list`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);
  await setVirgoSelection(page, 1, 1);

  const temp = `
  # demo

  - bulleted list1
      - bulleted list2
  1. number list1
  2. number list2
`;
  const value = {
    '0': {
      'sys:id': '0',
      'sys:flavour': 'affine:page',
      'sys:children': ['1'],
      'prop:title': '',
    },
    '1': {
      'sys:id': '1',
      'sys:flavour': 'affine:frame',
      'sys:children': ['3', '4', '6', '7', '2'],
      'prop:xywh': '[0,0,720,80]',
      'prop:background': '--affine-background-secondary-color',
    },
    '2': {
      'sys:id': '2',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': '',
    },
    '3': {
      'sys:id': '3',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h1',
      'prop:text': 'demo',
    },
    '4': {
      'sys:id': '4',
      'sys:flavour': 'affine:list',
      'sys:children': ['5'],
      'prop:type': 'bulleted',
      'prop:text': 'bulleted list1',
      'prop:checked': false,
    },
    '5': {
      'sys:id': '5',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'bulleted',
      'prop:text': 'bulleted list2',
      'prop:checked': false,
    },
    '6': {
      'sys:id': '6',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'numbered',
      'prop:text': 'number list1',
      'prop:checked': false,
    },
    '7': {
      'sys:id': '7',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'numbered',
      'prop:text': 'number list2',
      'prop:checked': false,
    },
  };
  await importMarkdown(page, frameId, temp);
  await assertStoreValue(page, 'space:page0', value);
});

test(scoped`import notion html-format text todo head`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);
  await setVirgoSelection(page, 1, 1);

  const temp = `
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>demo</title>
  </head>
  <body>
    <article id="8da888cd-8160-4fd6-929c-628fca9189d8" class="page sans">
      <header><h1 class="page-title">demo</h1></header>
      <div class="page-body">
        <p id="235af9ae-9e96-4964-aeb3-a5d02161347a" class="">text</p>
        <ul id="4e03c0bc-7e23-40d7-97a1-2f06f1c5dd66" class="to-do-list">
          <li>
            <div class="checkbox checkbox-off"></div>
            <span class="to-do-children-unchecked">todo1</span>
            <div class="indented">
              <ul id="7021470a-8cf1-40db-9f8d-e93329495798" class="to-do-list">
                <li>
                  <div class="checkbox checkbox-off"></div>
                  <span class="to-do-children-unchecked">todo2</span>
                  <div class="indented"></div>
                </li>
              </ul>
            </div>
          </li>
        </ul>
        <h1 id="847c5b52-11dc-45a6-952d-58409347ff8e" class="">heading1</h1>
        <h2 id="0c623ed7-b9d5-4997-a09a-ec6a3c19b59f" class="">heading2</h2>
        <h3 id="b1530a58-3902-4b69-826f-7f3df35fee58" class="">heading3</h3>
      </div>
    </article>
  </body>
  </html>
`;
  const value = {
    '0': {
      'sys:id': '0',
      'sys:flavour': 'affine:page',
      'sys:children': ['1'],
      'prop:title': '',
    },
    '1': {
      'sys:id': '1',
      'sys:flavour': 'affine:frame',
      'sys:children': ['3', '4', '5', '9', '10', '11', '2'],
      'prop:xywh': '[0,0,720,80]',
      'prop:background': '--affine-background-secondary-color',
    },
    '2': {
      'sys:id': '2',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': '',
    },
    '3': {
      'sys:id': '3',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h1',
      'prop:text': 'demo',
    },
    '4': {
      'sys:id': '4',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': 'text',
    },
    '5': {
      'sys:id': '5',
      'sys:flavour': 'affine:list',
      'sys:children': ['6', '7'],
      'prop:type': 'bulleted',
      'prop:text': '            ',
      'prop:checked': false,
    },
    '6': {
      'sys:id': '6',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': 'todo1',
    },
    '7': {
      'sys:id': '7',
      'sys:flavour': 'affine:list',
      'sys:children': ['8'],
      'prop:type': 'bulleted',
      'prop:text': '                  ',
      'prop:checked': false,
    },
    '8': {
      'sys:id': '8',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': 'todo2',
    },
    '9': {
      'sys:id': '9',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h1',
      'prop:text': 'heading1',
    },
    '10': {
      'sys:id': '10',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h2',
      'prop:text': 'heading2',
    },
    '11': {
      'sys:id': '11',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h3',
      'prop:text': 'heading3',
    },
  };
  await importMarkdown(page, frameId, temp);
  await assertStoreValue(page, 'space:page0', value);
});

test(scoped`import notion html-format list`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await resetHistory(page);
  await setVirgoSelection(page, 1, 1);

  const temp = `
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>demo</title>
  </head>
  <body>
    <article id="8da888cd-8160-4fd6-929c-628fca9189d8" class="page sans">
      <header><h1 class="page-title">demo</h1></header>
      <div class="page-body">
        <ul id="c2dbd922-c84f-474d-a56f-66e0058bb1d7" class="bulleted-list">
          <li style="list-style-type: disc">
            bulleted list1
            <ul id="380d5f50-c38a-464d-aa3f-94fa53262359" class="bulleted-list">
              <li style="list-style-type: circle">bulleted list2</li>
            </ul>
          </li>
        </ul>
        <ol
          type="1"
          id="fb1a54e1-c2b5-4eef-9ec6-ab7d4f1bfa94"
          class="numbered-list"
          start="1"
        >
          <li>number list1</li>
        </ol>
        <ol
          type="1"
          id="a1e7f225-005b-433c-bfd7-cab4b6f40094"
          class="numbered-list"
          start="2"
        >
          <li>number list2</li>
        </ol>
      </div>
    </article>
  </body>
  </html>
`;
  const value = {
    '0': {
      'sys:id': '0',
      'sys:flavour': 'affine:page',
      'sys:children': ['1'],
      'prop:title': '',
    },
    '1': {
      'sys:id': '1',
      'sys:flavour': 'affine:frame',
      'sys:children': ['3', '4', '6', '7', '2'],
      'prop:xywh': '[0,0,720,80]',
      'prop:background': '--affine-background-secondary-color',
    },
    '2': {
      'sys:id': '2',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'text',
      'prop:text': '',
    },
    '3': {
      'sys:id': '3',
      'sys:flavour': 'affine:paragraph',
      'sys:children': [],
      'prop:type': 'h1',
      'prop:text': 'demo',
    },
    '4': {
      'sys:id': '4',
      'sys:flavour': 'affine:list',
      'sys:children': ['5'],
      'prop:type': 'bulleted',
      'prop:text': '            bulleted list1            ',
      'prop:checked': false,
    },
    '5': {
      'sys:id': '5',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'bulleted',
      'prop:text': 'bulleted list2',
      'prop:checked': false,
    },
    '6': {
      'sys:id': '6',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'numbered',
      'prop:text': 'number list1',
      'prop:checked': false,
    },
    '7': {
      'sys:id': '7',
      'sys:flavour': 'affine:list',
      'sys:children': [],
      'prop:type': 'numbered',
      'prop:text': 'number list2',
      'prop:checked': false,
    },
  };
  await importMarkdown(page, frameId, temp);
  await assertStoreValue(page, 'space:page0', value);
});
