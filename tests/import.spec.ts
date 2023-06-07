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

  const blocks = await transformMarkdown(page, tempText);
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
      type: 'h1',
      text: [
        {
          insert: 'demo',
          attributes: {},
        },
      ],
      children: [],
    },
    {
      flavour: 'affine:database',
      databaseProps: {
        id: '3',
        title: 'Database',
        titleColumnWidth: 432,
        rowIds: ['4', '5', '6'],
        cells: {
          '4': {
            '1': {
              columnId: '1',
              value: 'table-title2',
            },
          },
          '5': {
            '1': {
              columnId: '1',
              value: 'table-content2',
            },
          },
          '6': {
            '1': {
              columnId: '1',
              value: '',
            },
          },
        },
        columns: [
          {
            name: '',
            type: 'rich-text',
            data: {},
            id: '1',
          },
          {
            name: '',
            type: 'rich-text',
            data: {},
            id: '2',
          },
        ],
      },
      children: [
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: 'table-title1',
            },
          ],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: 'table-content1',
            },
          ],
          children: [],
        },
        {
          flavour: 'affine:paragraph',
          type: 'text',
          text: [
            {
              insert: '',
            },
          ],
          children: [],
        },
      ],
    },
  ];

  const blocks = await transformMarkdown(page, tempText);
  const str = JSON.stringify(blocks);
  expect(blocks).toEqual(expectedValue);
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
          flavour: 'affine:embed',
          type: 'image',
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
          flavour: 'affine:embed',
          type: 'image',
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
//       flavour: 'affine:embed',
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
//       flavour: 'affine:embed',
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

//   const blocks = await transformMarkdown(page, tempText);
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

  const blocks = await transformMarkdown(page, tempText);
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

  const blocks = await transformMarkdown(page, tempText);
  expect(blocks).toEqual(expectedValue);
});
