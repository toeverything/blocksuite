import type { BlockSnapshot } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { NotionHtmlAdapter } from './notion-html.js';
import { nanoidReplacement } from './utils.unit.spec.js';

describe('notion html to snapshot', () => {
  test('code', async () => {
    const html = `<div class="page-body">
    <pre id="bd6132f7-3665-4f9f-84e6-d057b2a89143" class="code"><code>def fib(n):
  a,b = 1,1
  for i in range(n-1):
      a,b = b,a+b
  return a</code></pre>
  </div>`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {},
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:code',
          props: {
            language: null,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert:
                    'def fib(n):\n  a,b = 1,1\n  for i in range(n-1):\n      a,b = b,a+b\n  return a',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter();
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('paragraph', async () => {
    const html = `<div class="page-body">
        <p id="13d0fd81-b7f7-47ca-ae21-5b96a36c5f23" class="">aaa
        <div class="indented">
            <p id="22a66b31-b267-4924-b0c6-cf08772184b6" class="">bbb
            <div class="indented">
                <p id="d07a767a-8b5b-4d07-bb20-7657e23bf3a0" class="">ccc</p>
            </div>
            </p>
            <p id="97cd6489-e270-41bb-833c-6b55cb4b2bf4" class="">ddd</p>
        </div>
        </p>
        <p id="ee10b0a1-ee8b-4f8a-9e1d-2b1c5f09006f" class="">eee</p>
    </div>`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {},
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[2]',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
              },
              children: [
                {
                  type: 'block',
                  id: 'matchesReplaceMap[3]',
                  flavour: 'affine:paragraph',
                  props: {
                    type: 'text',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                  },
                  children: [],
                },
              ],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[4]',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
              },
              children: [],
            },
          ],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[5]',
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };
    const adapter = new NotionHtmlAdapter();
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('heading', async () => {
    const html = `<div class="page-body">
        <h1 id="bd6132f7-3665-4f9f-84e6-d057b2a89143" class="">1</h1>
        <h2 id="d879940f-7444-46e9-97ed-aeb2ba155a66" class="">2</h2>
        <h3 id="57618fab-adee-4c23-b9f4-2d7f4016f3ed" class="">3</h3>
      </div>`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {},
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:heading',
          props: {
            type: 'h1',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '1',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[2]',
          flavour: 'affine:heading',
          props: {
            type: 'h2',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '2',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[3]',
          flavour: 'affine:heading',
          props: {
            type: 'h3',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '3',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter();
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('list', async () => {
    const html = `<div class="page-body">
      <ul id="024f4224-8dbd-4071-8d8c-434c95a52e92" class="bulleted-list">
        <li style="list-style-type:disc">aaa
          <ul id="b6a79b76-79f7-46ab-b8f3-24cbc39671b5" class="bulleted-list">
            <li style="list-style-type:circle">bbb
              <ul id="d62bbf27-b430-4d08-a0d3-e5ea5e23f011"
                class="bulleted-list">
                <li style="list-style-type:square">ccc</li>
              </ul>
            </li>
          </ul>
          <ul id="97c56dc0-60eb-4341-88a5-20d32a335ccc" class="bulleted-list">
            <li style="list-style-type:circle">ddd</li>
          </ul>
        </li>
      </ul>
      <ul id="50c9ca0a-7ccf-472c-9a27-26222bad9f79" class="bulleted-list">
        <li style="list-style-type:disc">eee</li>
      </ul>
      <ul id="1909cf8c-fbfb-4e58-b9ef-6c69fc909540" class="to-do-list">
        <li>
          <div class="checkbox checkbox-off"></div> <span class="to-do-children-unchecked">aaa</span>
          <div class="indented">
            <ul id="e1d12532-5564-4307-955e-e6039cd92066" class="to-do-list">
              <li>
                <div class="checkbox checkbox-on"></div> <span class="to-do-children-checked">bbb</span>
                <div class="indented">
                  <ul id="773766fb-a363-41ff-bac1-226867263e88" class="to-do-list">
                    <li>
                      <div class="checkbox checkbox-off"></div> <span
                        class="to-do-children-unchecked">ccc</span>
                      <div class="indented"></div>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
            <ul id="7e8cc337-537a-41d1-bb11-d142dd4d96de" class="to-do-list">
              <li>
                <div class="checkbox checkbox-off"></div> <span
                  class="to-do-children-unchecked">ddd</span>
                <div class="indented"></div>
              </li>
            </ul>
          </div>
        </li>
      </ul>
      <ul id="59d1d39b-bebc-4492-ac7d-085f7509dcc7" class="to-do-list">
        <li>
          <div class="checkbox checkbox-on"></div> <span class="to-do-children-checked">eee</span>
          <div class="indented"></div>
        </li>
      </ul>
      <ol type="1" id="fb9b183d-4546-4f1b-8c71-756b331ec6c5" class="numbered-list" start="1">
        <li>aaa<ol type="a" id="4364fb4a-c9b4-428e-af16-7209b66f03c5" class="numbered-list" start="1">
            <li>bbb<ol type="i" id="a455f3a6-f6d2-4d27-9be6-2967455a2828" class="numbered-list" start="1">
                <li>ccc</li>
              </ol>
            </li>
          </ol>
          <ol type="a" id="e79dc443-0ecd-4349-b30f-ad469319afd3" class="numbered-list" start="2">
            <li>ddd</li>
          </ol>
        </li>
      </ol>
      <ol type="1" id="aeb899ff-2e74-4b4d-852c-104298c1bdde" class="numbered-list" start="2">
        <li>eee</li>
      </ol>
      <ul id="1f601f9b-5243-4f79-a4fb-37ebc663ac12" class="toggle">
        <li>
          <details open="">
            <summary>aaa</summary>
            <ul id="04461279-c97a-4437-82ef-14130da570c7" class="toggle">
              <li>
                <details open="">
                  <summary>bbb</summary>
                  <ul id="05b7957f-ce0c-41e4-af1d-1180ca129711" class="toggle">
                    <li>
                      <details open="">
                        <summary>ccc</summary>
                        <p id="2e8124be-fa95-476b-8c52-d74f3387b029" class="">ddd</p>
                      </details>
                    </li>
                  </ul>
                  <p id="1ad7fa76-135f-42d2-aa14-a2c0492ceb2b" class="">eee</p>
                </details>
              </li>
            </ul>
            <p id="f4444fea-7ff2-42c4-a3d7-ce89b574397d" class="">fff</p>
          </details>
        </li>
      </ul>
    </div>`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {},
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:list',
          props: {
            type: 'bulleted',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            checked: false,
            collapsed: false,
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[2]',
              flavour: 'affine:list',
              props: {
                type: 'bulleted',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                checked: false,
                collapsed: false,
              },
              children: [
                {
                  type: 'block',
                  id: 'matchesReplaceMap[3]',
                  flavour: 'affine:list',
                  props: {
                    type: 'bulleted',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    checked: false,
                    collapsed: false,
                  },
                  children: [],
                },
              ],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[4]',
              flavour: 'affine:list',
              props: {
                type: 'bulleted',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                checked: false,
                collapsed: false,
              },
              children: [],
            },
          ],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[5]',
          flavour: 'affine:list',
          props: {
            type: 'bulleted',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            checked: false,
            collapsed: false,
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[6]',
          flavour: 'affine:list',
          props: {
            type: 'todo',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            checked: false,
            collapsed: false,
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[7]',
              flavour: 'affine:list',
              props: {
                type: 'todo',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                checked: true,
                collapsed: false,
              },
              children: [
                {
                  type: 'block',
                  id: 'matchesReplaceMap[8]',
                  flavour: 'affine:list',
                  props: {
                    type: 'todo',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    checked: false,
                    collapsed: false,
                  },
                  children: [],
                },
              ],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[9]',
              flavour: 'affine:list',
              props: {
                type: 'todo',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                checked: false,
                collapsed: false,
              },
              children: [],
            },
          ],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[10]',
          flavour: 'affine:list',
          props: {
            type: 'todo',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            checked: true,
            collapsed: false,
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[11]',
          flavour: 'affine:list',
          props: {
            type: 'numbered',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            checked: false,
            collapsed: false,
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[12]',
              flavour: 'affine:list',
              props: {
                type: 'numbered',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                checked: false,
                collapsed: false,
              },
              children: [
                {
                  type: 'block',
                  id: 'matchesReplaceMap[13]',
                  flavour: 'affine:list',
                  props: {
                    type: 'numbered',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    checked: false,
                    collapsed: false,
                  },
                  children: [],
                },
              ],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[14]',
              flavour: 'affine:list',
              props: {
                type: 'numbered',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                checked: false,
                collapsed: false,
              },
              children: [],
            },
          ],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[15]',
          flavour: 'affine:list',
          props: {
            type: 'numbered',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            checked: false,
            collapsed: false,
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[16]',
          flavour: 'affine:list',
          props: {
            type: 'toggle',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            checked: false,
            collapsed: false,
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[17]',
              flavour: 'affine:list',
              props: {
                type: 'toggle',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                checked: false,
                collapsed: false,
              },
              children: [
                {
                  type: 'block',
                  id: 'matchesReplaceMap[18]',
                  flavour: 'affine:list',
                  props: {
                    type: 'toggle',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    checked: false,
                    collapsed: false,
                  },
                  children: [
                    {
                      type: 'block',
                      id: 'matchesReplaceMap[19]',
                      flavour: 'affine:paragraph',
                      props: {
                        type: 'text',
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'ddd',
                            },
                          ],
                        },
                      },
                      children: [],
                    },
                  ],
                },
                {
                  type: 'block',
                  id: 'matchesReplaceMap[20]',
                  flavour: 'affine:paragraph',
                  props: {
                    type: 'text',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'eee',
                        },
                      ],
                    },
                  },
                  children: [],
                },
              ],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[21]',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'fff',
                    },
                  ],
                },
              },
              children: [],
            },
          ],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter();
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('quote', async () => {
    const html = `<div class="page-body">
      <blockquote id="a2199afd-d2ec-4dad-a183-a0b6755d1b0a" class="">aaa</blockquote>
      <blockquote id="e0c60f97-8885-480b-8bb4-f2ed5428ac30" class="">bbb<p
          id="6658e25c-6d55-4a04-a0b0-b8e7ee76b318" class="">ccc
        <div class="indented">
          <p id="6c40ca8d-3137-475d-8123-200c6223b6dd" class="">ddd</p>
        </div>
        </p>
      </blockquote>
    </div>`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {},
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:paragraph',
          props: {
            type: 'quote',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[2]',
          flavour: 'affine:paragraph',
          props: {
            type: 'quote',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'bbb',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[3]',
          flavour: 'affine:paragraph',
          props: {
            type: 'quote',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'ccc',
                },
              ],
            },
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[4]',
              flavour: 'affine:paragraph',
              props: {
                type: 'quote',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
              },
              children: [],
            },
          ],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter();
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
