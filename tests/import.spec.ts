import './utils/declare-test-window.js';

import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  transformMarkdown,
} from './utils/actions/index.js';
import { scoped, test } from './utils/playwright.js';
test(scoped`import notion markdown-format text todo head`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  # demo

  text

  - [ ]  todo1
      - [ ]  todo2

  # heading1

  ## heading2

  ### heading3
`;

  const expectedValue = [
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [{ insert: '  text', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [{ insert: ' todo1', attributes: {} }],
      children: [
        {
          flavour: 'affine:list',
          type: 'todo',
          checked: false,
          text: [{ insert: ' todo2', attributes: {} }],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'heading1', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'h2',
      text: [{ insert: 'heading2', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'h3',
      text: [{ insert: 'heading3', attributes: {} }],
      children: [],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion html-format text todo head`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
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
  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'header',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [{ insert: 'text', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'bulleted',
      text: [
        { insert: '', attributes: {} },
        { insert: '            ', attributes: {} },
      ],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'todo1', attributes: {} }],
          children: [],
        },
        {
          flavour: 'affine:list',
          type: 'bulleted',
          text: [
            { insert: '', attributes: {} },
            { insert: '                  ', attributes: {} },
          ],
          children: [
            {
              flavour: 'affine:paragraph',
              type: 'text',
              text: [{ insert: 'todo2', attributes: {} }],
              children: [],
            },
          ],
        },
      ],
    },
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'heading1', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'h2',
      text: [{ insert: 'heading2', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'h3',
      text: [{ insert: 'heading3', attributes: {} }],
      children: [],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion markdown-format list`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  # demo

  - bulleted list1
      - bulleted list2
  1. number list1
  2. number list2
`;

  const expectedValue = [
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'bulleted',
      text: [{ insert: 'bulleted list1', attributes: {} }],
      children: [
        {
          flavour: 'affine:list',
          type: 'bulleted',
          text: [{ insert: 'bulleted list2', attributes: {} }],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'numbered',
      text: [{ insert: 'number list1', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'numbered',
      text: [{ insert: 'number list2', attributes: {} }],
      children: [],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion html-format list`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
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
  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'header',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'bulleted',
      text: [
        { insert: '', attributes: {} },
        { insert: '            bulleted list1', attributes: {} },
        { insert: '            ', attributes: {} },
      ],
      children: [
        {
          flavour: 'affine:list',
          type: 'bulleted',
          text: [{ insert: 'bulleted list2', attributes: {} }],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'numbered',
      text: [{ insert: 'number list1', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'numbered',
      text: [{ insert: 'number list2', attributes: {} }],
      children: [],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion markdown-format table`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  # demo
  
  | table-title1 | table-title2 |
  | --- | --- |
  | table-content1 | table-content2 |
  |  |  |
`;

  const expectedValue = [
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:database',
      databaseProps: {
        id: '3',
        title: 'Database',
        titleColumnName: 'table-title1',
        titleColumnWidth: 432,
        rowIds: ['4', '5'],
        cells: {
          '4': { '1': { columnId: '1', value: 'table-content2' } },
          '5': { '1': { columnId: '1', value: '' } },
        },
        columns: [
          {
            name: 'table-title2',
            type: 'rich-text',
            width: 200,
            hide: false,
            id: '1',
          },
          { name: '', type: 'rich-text', width: 200, hide: false, id: '2' },
        ],
      },
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'table-content1' }],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: '' }],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion html-format table`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>demo</title>
  </head>
  <body>
    <article id="8da888cd-8160-4fd6-929c-628fca9189d8" class="page sans">
      <header><h1 class="page-title">demo</h1></header>
      <div class="page-body">
        <table id="b94f7bb7-9331-4121-8fe5-866465277b93" class="simple-table">
          <tbody>
            <tr id="c35d91c6-e443-4eb4-b70b-b1fc16f193d4">
              <td id="FkBK" class="">table-title1</td>
              <td id="&gt;VYO" class="">table-title2</td>
            </tr>
            <tr id="a04ad6bc-476a-4420-9103-9d43f9ac4d1e">
              <td id="FkBK" class="">table-content1</td>
              <td id="&gt;VYO" class="">table-content2</td>
            </tr>
            <tr id="1d0064a3-300e-44ca-870b-e969f691b839">
              <td id="FkBK" class=""></td>
              <td id="&gt;VYO" class=""></td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </body>
  </html>
`;

  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'header',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:database',
      databaseProps: {
        id: '2',
        title: 'Database',
        titleColumnWidth: 432,
        rowIds: ['3', '4', '5'],
        cells: {
          '3': { '1': { columnId: '1', value: 'table-title2' } },
          '4': { '1': { columnId: '1', value: 'table-content2' } },
          '5': { '1': { columnId: '1', value: '' } },
        },
        columns: [
          { name: '', type: 'rich-text', width: 200, hide: false, id: '1' },
        ],
      },
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'table-title1' }],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'table-content1' }],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: '' }],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});
