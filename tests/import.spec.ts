import './utils/declare-test-window.js';

import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  transformHtml,
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
      type: 'h1',
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
      type: 'todo',
      checked: false,
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
          type: 'todo',
          checked: false,
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

  const blocks = await transformHtml(page, tempText);
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
      type: 'h1',
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

  const blocks = await transformHtml(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion html-format bookmark`, async ({ page }) => {
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
        <figure id="5b57744f-875a-4a73-b86b-a0a4c6e4de73">
          <a
            href="https://www.nytimes.com/2018/03/08/arts/chicago-museums-art.html?rref=collection%2Fsectioncollection%2Ftravel"
            class="bookmark source"
            ><div class="bookmark-info">
              <div class="bookmark-text">
                <div class="bookmark-title">
                  Beyond Frank Lloyd Wright: A Broader View of Art in Chicago
                </div>
                <div class="bookmark-description">
                  "We had been aware of the Walker exhibit but hadn't quite known how to
                  connect," said Steve Weaver, executive director of the Chicago Public
                  Art Group. On April 7 it is hosting a Terra-supported tour of
                  neighborhood murals by Mr. Walker, as well as by artists including
                  Mitchell Caton, Calvin Jones and Justine DeVan, with a stop at the
                  Hyde Park exhibition.
                </div>
              </div>
              <div class="bookmark-href">
                <img
                  src="https://static01.nyt.com/favicon.ico"
                  class="icon bookmark-icon"
                />https://www.nytimes.com/2018/03/08/arts/chicago-museums-art.html?rref=collection%2Fsectioncollection%2Ftravel
              </div>
            </div>
            <img
              src="https://static01.nyt.com/images/2018/03/15/arts/15ARTCHICAGO1/15ARTCHICAGO1-facebookJumbo.jpg"
              class="bookmark-image"
          /></a>
        </figure>
      </div>
    </article>
  </body>
  </html>
`;
  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'h1',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:bookmark',
      children: [],
      url: 'https://www.nytimes.com/2018/03/08/arts/chicago-museums-art.html?rref=collection%2Fsectioncollection%2Ftravel',
    },
  ];

  const blocks = await transformHtml(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

// todo this is temporary solution
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
        rowIds: ['4', '5'],
        cells: {
          '4': { '1': { columnId: '1', value: 'table-content2' } },
          '5': { '1': { columnId: '1', value: '' } },
        },
        columns: [
          {
            name: 'table-title2',
            type: 'rich-text',
            data: {},
            id: '1',
          },
          { name: '', type: 'rich-text', data: {}, id: '2' },
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

// todo this is temporary solution
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
      <table class="collection-content">
      <thead>
        <tr>
          <th>
            <span class="icon property-icon"
              ><svg
                class="typesTitle"
              >
                </svg></span
            >Name
          </th>
          <th>
            <span class="icon property-icon"
              ><svg
                class="typesText"
              >
                </svg></span
            >Text
          </th>
          <th>
            <span class="icon property-icon"
              ><svg
                class="typesSelect"
              >
                </svg></span
            >Select
          </th>
          <th>
            <span class="icon property-icon"
              ><svg
                class="typesMultipleSelect"
              >
                </svg></span
            >Multi-select
          </th>
          <th>
            <span class="icon property-icon"
              ><svg
                class="typesCheckbox"
              >
                </svg></span
            >Checkbox
          </th>
          <th>
            <span class="icon property-icon"
              ><svg
                class="typesNumber"
              >
                </svg></span
            >Number
          </th>
        </tr>
      </thead>
      <tbody>
        <tr id="421a5c7b-5d4f-469d-b00b-cdbcd87833c8">
          <td class="cell-title">
            <a
              href="Untitled%20Database%2077a6e37b9f014fffb4ebacf37d9120a2/@Untitled%20421a5c7b5d4f469db00bcdbcd87833c8.html"
              >@Untitled
            </a>
          </td>
          <td class="cell-LBE^"></td>
          <td class="cell-vnv~">
            <span class="selected-value select-value-color-purple">s</span>
          </td>
          <td class="cell-qUzA">
            <span class="selected-value select-value-color-purple"
              >aaa</span
            >
          </td>
          <td class="cell-t&gt;Zc">
            <div class="checkbox checkbox-on"></div>
          </td>
          <td class="cell-Oy}n">123</td>
        </tr>
        <tr id="bfdd7e43-902f-4a77-a08f-19e73c57764e">
          <td class="cell-title">
            <a
              href="Untitled%20Database%2077a6e37b9f014fffb4ebacf37d9120a2/Untitled%20bfdd7e43902f4a77a08f19e73c57764e.html"
              >Untitled</a
            >
          </td>
          <td class="cell-LBE^">aaa</td>
          <td class="cell-vnv~">
            <span class="selected-value select-value-color-pink">a</span>
          </td>
          <td class="cell-qUzA">
            <span class="selected-value select-value-color-pink">bbb</span>
          </td>
          <td class="cell-t&gt;Zc">
            <div class="checkbox checkbox-off"></div>
          </td>
          <td class="cell-Oy}n"></td>
        </tr>
        <tr id="f2f5456d-55cd-4b47-8783-376586e6cc86">
          <td class="cell-title">
            <a
              href="Untitled%20Database%2077a6e37b9f014fffb4ebacf37d9120a2/Untitled%20f2f5456d55cd4b478783376586e6cc86.html"
              >Untitled</a
            >
          </td>
          <td class="cell-LBE^"></td>
          <td class="cell-vnv~">
            <span class="selected-value select-value-color-purple">s</span>
          </td>
          <td class="cell-qUzA">
            <span class="selected-value select-value-color-purple">aaa</span
            ><span class="selected-value select-value-color-pink">bbb</span>
          </td>
          <td class="cell-t&gt;Zc">
            <div class="checkbox checkbox-off"></div>
          </td>
          <td class="cell-Oy}n"></td>
        </tr>
      </tbody>
    </table>
    <br />
      </div>
    </article>
  </body>
  </html>
`;

  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'h1',
      text: [
        {
          insert: 'demo',
          'matchesReplaceMap[0]': {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:database',
      databaseProps: {
        id: '7',
        title: 'Database',
        rowIds: ['8', '9', '10'],
        cells: {
          '8': {
            '1': {
              columnId: '1',
              value: '',
            },
            '2': {
              columnId: '2',
              value: 'matchesReplaceMap[8]',
            },
            '3': {
              columnId: '3',
              value: ['matchesReplaceMap[12]'],
            },
            '4': {
              columnId: '4',
              value: 'on',
            },
            '5': {
              columnId: '5',
              value: '123',
            },
          },
          '9': {
            '1': {
              columnId: '1',
              value: 'aaa',
            },
            '2': {
              columnId: '2',
              value: 'matchesReplaceMap[10]',
            },
            '3': {
              columnId: '3',
              value: ['matchesReplaceMap[14]'],
            },
            '4': {
              columnId: '4',
              value: '',
            },
            '5': {
              columnId: '5',
              value: '',
            },
          },
          '10': {
            '1': {
              columnId: '1',
              value: '',
            },
            '2': {
              columnId: '2',
              value: 'matchesReplaceMap[8]',
            },
            '3': {
              columnId: '3',
              value: ['matchesReplaceMap[12]', 'matchesReplaceMap[14]'],
            },
            '4': {
              columnId: '4',
              value: '',
            },
            '5': {
              columnId: '5',
              value: '',
            },
          },
        },
        columns: [
          {
            id: '1',
            type: 'rich-text',
            name: 'Text',
            data: {},
          },
          {
            id: '2',
            type: 'select',
            name: 'Select',
            data: {
              options: [
                {
                  id: 'matchesReplaceMap[8]',
                  value: 's',
                  color: 'matchesReplaceMap[9]',
                },
                {
                  id: 'matchesReplaceMap[10]',
                  value: 'a',
                  color: 'matchesReplaceMap[11]',
                },
              ],
            },
          },
          {
            id: '3',
            type: 'multi-select',
            name: 'Multi-select',
            data: {
              options: [
                {
                  id: 'matchesReplaceMap[12]',
                  value: 'aaa',
                  color: 'matchesReplaceMap[13]',
                },
                {
                  id: 'matchesReplaceMap[14]',
                  value: 'bbb',
                  color: 'matchesReplaceMap[15]',
                },
              ],
            },
          },
          {
            id: '4',
            type: 'checkbox',
            name: 'Checkbox',
            data: {},
          },
          {
            id: '5',
            type: 'number',
            name: 'Number',
            data: {
              decimal: 0,
            },
          },
          {
            id: '6',
            type: 'rich-text',
            name: '',
            data: {},
          },
        ],
      },
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '@Untitled\n            ',
            },
          ],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: 'Untitled',
            },
          ],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: 'Untitled',
            },
          ],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformHtml(page, tempText);
  const blocksString = JSON.stringify(blocks, null, 2);
  const matches = blocksString.matchAll(
    /("[A-Za-z0-9-_]{10}")|("var\(--affine-tag-[a-z]{3,10}\)")/g
  );
  const matchesReplaceMap = new Map();
  Array.from(matches).map((match, index) =>
    matchesReplaceMap.set(match[0], `"matchesReplaceMap[${index}]"`)
  );
  const replacedBlocksString = blocksString.replace(
    /("[A-Za-z0-9-_]{10}")|("var\(--affine-tag-[a-z]{3,10}\)")/g,
    match => matchesReplaceMap.get(match)
  );
  expect(JSON.parse(replacedBlocksString)).toEqual(expectedValue);
});

// todo this is temporary solution
test(scoped`import notion markdown-format image`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  # image

  ![Untitled](image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png)
  
  ![https://images.unsplash.com/photo-1662321979743-3d0a327397bb?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb](https://images.unsplash.com/photo-1662321979743-3d0a327397bb?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb)
  
  ![rachit-tank-2cFZ_FB08UM-unsplash.jpg](image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg)
  
  ![https://media1.giphy.com/media/HJZblxmxHb7CbZtmNy/giphy.gif?cid=7941fdc629znta1bnwp46vdn5ex496a0ra92or1smz7xwfo6&ep=v1_gifs_trending&rid=giphy.gif&ct=g](https://media1.giphy.com/media/HJZblxmxHb7CbZtmNy/giphy.gif?cid=7941fdc629znta1bnwp46vdn5ex496a0ra92or1smz7xwfo6&ep=v1_gifs_trending&rid=giphy.gif&ct=g)
  
  [Google](http://www.google.com)
`;

  const expectedValue = [
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'image', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [{ insert: '  ', attributes: {} }],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          children: [],
          text: [
            {
              insert: 'image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png',
              attributes: {
                link: 'image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png',
              },
            },
          ],
        },
      ],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [{ insert: '  ', attributes: {} }],
      children: [
        {
          flavour: 'affine:image',
          sourceId: 'A-Bc3g7vFANwRhy2VdNLoJQGMLfSjAAYD_jCJKxEVgs=',
          children: [],
          text: [{ insert: '' }],
        },
      ],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [{ insert: '  ', attributes: {} }],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          children: [],
          text: [
            {
              insert:
                'image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg',
              attributes: {
                link: 'image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg',
              },
            },
          ],
        },
      ],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [{ insert: '  ', attributes: {} }],
      children: [
        {
          flavour: 'affine:image',
          sourceId: 'lz7uFN73qjI6JbjHqpflMRU4YZmFG63Bn_trPJygbRo=',
          children: [],
          text: [{ insert: '' }],
        },
      ],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [
        { insert: '  ', attributes: {} },
        { insert: 'Google', attributes: { link: 'http://www.google.com' } },
      ],
      children: [],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

// todo this is temporary solution
// test(scoped`import notion html-format image`, async ({ page }) => {
//   await enterPlaygroundRoom(page);

//   const tempText = `
//   <html>
//   <head>
//     <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
//     <title>demo</title>
//   </head>
//   <body>
//     <article id="8da888cd-8160-4fd6-929c-628fca9189d8" class="page sans">
//       <header><h1 class="page-title">demo</h1></header>
//       <div class="page-body">
//       <figure id="c1484c02-09a5-4bb8-8ba1-8f681f49c8b0" class="image">
//       <a href="image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png"
//         ><img
//           style="width: 524px"
//           src="image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png"
//       /></a>
//     </figure>
//     <figure id="cda1e799-663f-4bb0-9591-e78e9c69abe9" class="image">
//       <a
//         href="https://images.unsplash.com/photo-1662321979743-3d0a327397bb?ixlib=rb-4.0.3&amp;q=85&amp;fm=jpg&amp;crop=entropy&amp;cs=srgb"
//         ><img
//           src="https://images.unsplash.com/photo-1662321979743-3d0a327397bb?ixlib=rb-4.0.3&amp;q=85&amp;fm=jpg&amp;crop=entropy&amp;cs=srgb"
//       /></a>
//     </figure>
//     <figure id="f456cd22-ed40-4a0d-8a4a-184782ce1e38" class="image">
//       <a
//         href="image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg"
//         ><img
//           style="width: 3484px"
//           src="image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg"
//       /></a>
//     </figure>
//     <figure id="c5503afa-03ea-4e71-9869-0a7043fdce44" class="image">
//       <a
//         href="https://media1.giphy.com/media/HJZblxmxHb7CbZtmNy/giphy.gif?cid=7941fdc629znta1bnwp46vdn5ex496a0ra92or1smz7xwfo6&amp;ep=v1_gifs_trending&amp;rid=giphy.gif&amp;ct=g"
//         ><img
//           src="https://media1.giphy.com/media/HJZblxmxHb7CbZtmNy/giphy.gif?cid=7941fdc629znta1bnwp46vdn5ex496a0ra92or1smz7xwfo6&amp;ep=v1_gifs_trending&amp;rid=giphy.gif&amp;ct=g"
//       /></a>
//     </figure>
//     <figure id="cf79d568-40e5-4044-902e-34dba584149c">
//       <a href="http://www.google.com" class="bookmark source"
//         ><div class="bookmark-info">
//           <div class="bookmark-text">
//             <div class="bookmark-title">Google</div>
//             <div class="bookmark-description">
//               Search the world&#x27;s information, including webpages,
//               images, videos and more. Google has many special features to
//               help you find exactly what you&#x27;re looking for.
//             </div>
//           </div>
//           <div class="bookmark-href">
//             <img
//               src="http://www.google.com/favicon.ico"
//               class="icon bookmark-icon"
//             />http://www.google.com
//           </div>
//         </div></a
//       >
//     </figure>
//       </div>
//     </article>
//   </body>
//   </html>
// `;

//   const expectedValue = [
//     {
//       flavour: 'affine:page',
//       type: 'header',
//       text: [{ insert: 'demo', attributes: {} }],
//       children: [],
//     },
//     {
//       flavour: 'affine:paragraph',
//       type: 'text',
//       children: [],
//       text: [
//         {
//           insert: 'image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png',
//           attributes: {
//             link: 'image%2013665bbaf5544871b0cbcd70e3d4799c/Untitled.png',
//           },
//         },
//       ],
//     },
//     {
//       flavour: 'affine:image',
//       type: 'image',
//       sourceId: 'A-Bc3g7vFANwRhy2VdNLoJQGMLfSjAAYD_jCJKxEVgs=',
//       children: [],
//       text: [],
//     },
//     {
//       flavour: 'affine:paragraph',
//       type: 'text',
//       children: [],
//       text: [
//         {
//           insert:
//             'image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg',
//           attributes: {
//             link: 'image%2013665bbaf5544871b0cbcd70e3d4799c/rachit-tank-2cFZ_FB08UM-unsplash.jpg',
//           },
//         },
//       ],
//     },
//     {
//       flavour: 'affine:image',
//       type: 'image',
//       sourceId: 'lz7uFN73qjI6JbjHqpflMRU4YZmFG63Bn_trPJygbRo=',
//       children: [],
//       text: [],
//     },
//     {
//       flavour: 'affine:paragraph',
//       type: 'text',
//       children: [],
//       text: [
//         {
//           insert: 'http://www.google.com/favicon.ico',
//           attributes: { link: 'http://www.google.com/favicon.ico' },
//         },
//       ],
//     },
//   ];

//   const blocks = await transformHtml(page, tempText);
//   expect(blocks).toEqual(expectedValue);
// });

// todo this is temporary solution
test(scoped`import notion markdown-format toggle list`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  # toggle

  - aaaaa
      
      dffffff
      
      yyyyy
`;

  const expectedValue = [
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'toggle', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'bulleted',
      text: [{ insert: 'aaaaa', attributes: {} }],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: '  dffffff', attributes: {} }],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: '  yyyyy', attributes: {} }],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

// todo this is temporary solution
test(scoped`import notion html-format toggle list`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>toggle</title>
  </head>
  <body>
    <article id="8da888cd-8160-4fd6-929c-628fca9189d8" class="page sans">
      <header><h1 class="page-title">demo</h1></header>
      <div class="page-body">
        <ul id="87419102-ff4a-4b6d-9d19-6b3778651906" class="toggle">
          <li>
            <details open="">
              <summary>aaaaa</summary>
              <p id="5383a34a-40d2-4a4e-b18e-1f36f377d725" class="">dffffff</p>
              <p id="c90bc710-b013-4db1-b5a5-9ffd3892259a" class="">yyyyy</p>
              <p id="7ef359a3-aeff-4860-b026-40a26d1b0493" class=""></p>
            </details>
          </li>
        </ul>
      </div>
    </article>
  </body>
  </html>
`;

  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'h1',
      text: [{ insert: 'demo', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'bulleted',
      text: [{ insert: 'aaaaa', attributes: {} }],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'aaaaa', attributes: {} }],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'dffffff', attributes: {} }],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: 'yyyyy', attributes: {} }],
          children: [],
        },
        { flavour: 'affine:paragraph', type: 'text', text: [], children: [] },
      ],
    },
  ];

  const blocks = await transformHtml(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

// todo this is temporary solution
test(scoped`import notion markdown-format inline`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  # inline

  @zuoxd [code](https://www.notion.so/code-f662c10383c842079da1e677cc851721) May 24, 2023 😆$E=A*2$
`;

  const expectedValue = [
    {
      flavour: 'affine:paragraph',
      type: 'h1',
      text: [{ insert: 'inline', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [
        { insert: '  @zuoxd ', attributes: {} },
        {
          insert: 'code',
          attributes: {
            link: 'https://www.notion.so/code-f662c10383c842079da1e677cc851721',
          },
        },
        { insert: ' May 24, 2023 😆$E=A*2$', attributes: {} },
      ],
      children: [],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

// todo this is temporary solution
test(scoped`import notion html-format inline`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  <html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>toggle</title>
  </head>
  <body>
  <article id="9916edda-0a33-4976-9bb0-e117f0a9fe15" class="page sans">
  <header><h1 class="page-title">inline</h1></header>
  <div class="page-body">
    <p id="f959060c-e5b2-45ae-9a05-f9c9ecfda5db" class="">
      <span class="user">@zuoxd</span>
      <a href="https://www.notion.so/code-f662c10383c842079da1e677cc851721"
        >code</a
      >
      <time>@May 24, 2023</time> 😆<style>
        @import url("https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.2/katex.min.css");</style
      ><span
        data-token-index="0"
        contenteditable="false"
        class="notion-text-equation-token"
        style="
          user-select: all;
          -webkit-user-select: all;
          -moz-user-select: all;
        "
        ><span></span
        ><span
          ><span class="katex"
            ><span class="katex-mathml"
              ><math xmlns="http://www.w3.org/1998/Math/MathML"
                ><semantics
                  ><mrow
                    ><mi>E</mi><mo>=</mo><mi>A</mi><mo>∗</mo
                    ><mn>2</mn></mrow
                  ><annotation encoding="application/x-tex"
                    >E=A*2</annotation
                  ></semantics
                ></math
              ></span
            ><span class="katex-html" aria-hidden="true"
              ><span class="base"
                ><span
                  class="strut"
                  style="height: 0.68333em; vertical-align: 0em"
                ></span
                ><span
                  class="mord mathnormal"
                  style="margin-right: 0.05764em"
                  >E</span
                ><span
                  class="mspace"
                  style="margin-right: 0.2777777777777778em"
                ></span
                ><span class="mrel">=</span
                ><span
                  class="mspace"
                  style="margin-right: 0.2777777777777778em"
                ></span></span
              ><span class="base"
                ><span
                  class="strut"
                  style="height: 0.68333em; vertical-align: 0em"
                ></span
                ><span class="mord mathnormal">A</span
                ><span
                  class="mspace"
                  style="margin-right: 0.2222222222222222em"
                ></span
                ><span class="mbin">∗</span
                ><span
                  class="mspace"
                  style="margin-right: 0.2222222222222222em"
                ></span></span
              ><span class="base"
                ><span
                  class="strut"
                  style="height: 0.64444em; vertical-align: 0em"
                ></span
                ><span class="mord">2</span></span
              ></span
            ></span
          ></span
        ><span></span></span
      >
    </p>
    <p id="6f15ae49-1c2f-4f51-8c7e-81605880ff34" class=""></p>
  </div>
</article>
  </body>
  </html>
`;

  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'h1',
      text: [{ insert: 'inline', attributes: {} }],
      children: [],
    },
    {
      flavour: 'affine:paragraph',
      type: 'text',
      text: [
        { insert: '', attributes: {} },
        { insert: '      ', attributes: {} },
        { insert: '@zuoxd', attributes: {} },
        { insert: '', attributes: {} },
        { insert: '      ', attributes: {} },
        {
          insert: 'code',
          attributes: {
            link: 'https://www.notion.so/code-f662c10383c842079da1e677cc851721',
          },
        },
        { insert: '', attributes: {} },
        { insert: '      ', attributes: {} },
        { insert: '@May 24, 2023', attributes: {} },
        { insert: ' 😆', attributes: {} },
        { insert: 'E', attributes: {} },
        { insert: '=', attributes: {} },
        { insert: 'A', attributes: {} },
        { insert: '∗', attributes: {} },
        { insert: '2', attributes: {} },
        { insert: '', attributes: {} },
        { insert: '    ', attributes: {} },
      ],
      children: [],
    },
    { flavour: 'affine:paragraph', type: 'text', text: [], children: [] },
  ];

  const blocks = await transformHtml(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion markdown-format todo`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  // fix: https://github.com/toeverything/blocksuite/issues/3304
  const tempText = `
  - [ ]  1.
  - [ ]  2.
  - [ ]  3.
  - [x]  4.
  - [ ]  5. 
  - [x]  
      1.
`;

  const expectedValue = [
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: ' 1.',
          attributes: {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: ' 2.',
          attributes: {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: ' 3.',
          attributes: {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: true,
      text: [
        {
          insert: ' 4.',
          attributes: {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: ' 5. ',
          attributes: {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: true,
      text: [
        {
          insert: ' ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:list',
          type: 'numbered',
          text: [],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});

test(scoped`import notion html-format todo list`, async ({ page }) => {
  await enterPlaygroundRoom(page);

  const tempText = `
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <title>demo</title>
    </head>
    <body>
      <article id="041bd128-3d2c-47ff-a383-3cfdc54ed674" class="page sans">
        <header>
          <h1 class="page-title"></h1>
          <p class="page-description"></p>
        </header>
        <div class="page-body">
          <ul id="50fce132-57a7-4cc6-852e-aba5d9440bac" class="to-do-list">
            <li>
              <div class="checkbox checkbox-off"></div>
              <span class="to-do-children-unchecked">1.</span>
              <div class="indented"></div>
            </li>
          </ul>
          <ul id="9e59bb39-1881-4ff5-a926-3d2779915df8" class="to-do-list">
            <li>
              <div class="checkbox checkbox-off"></div>
              <span class="to-do-children-unchecked">2.</span>
              <div class="indented"></div>
            </li>
          </ul>
          <ul id="f5cb71b2-e890-48c9-bcaf-dd7777d2371c" class="to-do-list">
            <li>
              <div class="checkbox checkbox-off"></div>
              <span class="to-do-children-unchecked">3.</span>
              <div class="indented"></div>
            </li>
          </ul>
          <ul id="c72b5284-b2e6-44ab-b649-bcc979f7c517" class="to-do-list">
            <li>
              <div class="checkbox checkbox-on"></div>
              <span class="to-do-children-checked">4.</span>
              <div class="indented"></div>
            </li>
          </ul>
          <ul id="ba800944-e519-4537-85ae-79b273a9d179" class="to-do-list">
            <li>
              <div class="checkbox checkbox-off"></div>
              <span class="to-do-children-unchecked">5.</span>
              <div class="indented"></div>
            </li>
          </ul>
          <ul id="135812d8-0f21-46d1-9545-aa46d2f32429" class="to-do-list">
            <li>
              <div class="checkbox checkbox-on"></div>
              <span class="to-do-children-checked"></span>
              <div class="indented">
                <ol
                  type="1"
                  id="55f9ad83-e60e-4bd0-a3f0-dd4dba70d24b"
                  class="numbered-list"
                  start="1"
                >
                  <li></li>
                </ol>
              </div>
            </li>
          </ul>
        </div>
      </article>
    </body>
  </html>
`;

  const expectedValue = [
    {
      flavour: 'affine:page',
      type: 'h1',
      text: [],
      children: [],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: '',
          attributes: {},
        },
        {
          insert: '              ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '1.',
              attributes: {},
            },
          ],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: '',
          attributes: {},
        },
        {
          insert: '              ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '2.',
              attributes: {},
            },
          ],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: '',
          attributes: {},
        },
        {
          insert: '              ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '3.',
              attributes: {},
            },
          ],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: true,
      text: [
        {
          insert: '',
          attributes: {},
        },
        {
          insert: '              ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '4.',
              attributes: {},
            },
          ],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: false,
      text: [
        {
          insert: '',
          attributes: {},
        },
        {
          insert: '              ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '5.',
              attributes: {},
            },
          ],
          children: [],
        },
      ],
    },
    {
      flavour: 'affine:list',
      type: 'todo',
      checked: true,
      text: [
        {
          insert: '',
          attributes: {},
        },
        {
          insert: '              ',
          attributes: {},
        },
      ],
      children: [
        {
          flavour: 'affine:list',
          type: 'numbered',
          text: [],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformHtml(page, tempText);
  expect(blocks).toEqual(expectedValue);
});
