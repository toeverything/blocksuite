import {
  AssetsManager,
  type BlockSnapshot,
  MemoryBlobManager,
} from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { nanoidReplacement } from '../test-utils/test-utils.js';
import { NotionHtmlAdapter } from './notion-html.js';

describe('notion html to snapshot', () => {
  test('code', async () => {
    const html = `<div class="page-body">
    <pre id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="code"><code>def fib(n):
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
        <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">aaa
        <div class="indented">
            <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">bbb
            <div class="indented">
                <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">ccc</p>
            </div>
            </p>
            <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">ddd</p>
        </div>
        </p>
        <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">eee</p>
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
        <h1 id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">1</h1>
        <h2 id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">2</h2>
        <h3 id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">3</h3>
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
      <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="bulleted-list">
        <li style="list-style-type:disc">aaa
          <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="bulleted-list">
            <li style="list-style-type:circle">bbb
              <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5"
                class="bulleted-list">
                <li style="list-style-type:square">ccc</li>
              </ul>
            </li>
          </ul>
          <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="bulleted-list">
            <li style="list-style-type:circle">ddd</li>
          </ul>
        </li>
      </ul>
      <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="bulleted-list">
        <li style="list-style-type:disc">eee</li>
      </ul>
      <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="to-do-list">
        <li>
          <div class="checkbox checkbox-off"></div> <span class="to-do-children-unchecked">aaa</span>
          <div class="indented">
            <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="to-do-list">
              <li>
                <div class="checkbox checkbox-on"></div> <span class="to-do-children-checked">bbb</span>
                <div class="indented">
                  <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="to-do-list">
                    <li>
                      <div class="checkbox checkbox-off"></div> <span
                        class="to-do-children-unchecked">ccc</span>
                      <div class="indented"></div>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
            <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="to-do-list">
              <li>
                <div class="checkbox checkbox-off"></div> <span
                  class="to-do-children-unchecked">ddd</span>
                <div class="indented"></div>
              </li>
            </ul>
          </div>
        </li>
      </ul>
      <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="to-do-list">
        <li>
          <div class="checkbox checkbox-on"></div> <span class="to-do-children-checked">eee</span>
          <div class="indented"></div>
        </li>
      </ul>
      <ol type="1" id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="numbered-list" start="1">
        <li>aaa<ol type="a" id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="numbered-list" start="1">
            <li>bbb<ol type="i" id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="numbered-list" start="1">
                <li>ccc</li>
              </ol>
            </li>
          </ol>
          <ol type="a" id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="numbered-list" start="2">
            <li>ddd</li>
          </ol>
        </li>
      </ol>
      <ol type="1" id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="numbered-list" start="2">
        <li>eee</li>
      </ol>
      <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="toggle">
        <li>
          <details open="">
            <summary>aaa</summary>
            <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="toggle">
              <li>
                <details open="">
                  <summary>bbb</summary>
                  <ul id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="toggle">
                    <li>
                      <details open="">
                        <summary>ccc</summary>
                        <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">ddd</p>
                      </details>
                    </li>
                  </ul>
                  <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">eee</p>
                </details>
              </li>
            </ul>
            <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">fff</p>
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
      <blockquote id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">aaa</blockquote>
      <blockquote id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">bbb<p
          id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">ccc
        <div class="indented">
          <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">ddd</p>
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

  test('callout', async () => {
    const html = `<div class="page-body">
      <figure class="block-color-gray_background callout" style="white-space:pre-wrap;display:flex"
        id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5">
        <div style="font-size:1.5em"><span class="icon">💡</span></div>
        <div style="width:100%">aaa</div>
      </figure>
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
                  insert: '💡',
                },
                {
                  insert: 'aaa',
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

  test('divider', async () => {
    const html = `<div class="page-body">
      <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">aaa</p>
      <hr id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" />
      <p id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="">bbb</p>
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
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[2]',
          flavour: 'affine:divider',
          props: {},
          children: [],
        },
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
                  insert: 'bbb',
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

  test('page-link', async () => {
    const html = `<div class="page-body">
      <figure id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="link-to-page"><a
          href="https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21">Untitled</a></figure>
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
                  insert: 'Untitled',
                  attributes: {
                    link: 'https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                  },
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

  test('image', async () => {
    const html = `<div class="page-body">
      <figure id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="image"><a
          href="https://affine.pro/favicon-96.png"><img src="https://affine.pro/favicon-96.png" /></a>
      </figure>
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
          flavour: 'affine:image',
          props: {
            sourceId: 'matchesReplaceMap[2]',
          },
          children: [],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter();
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
      assets: new AssetsManager({ blob: new MemoryBlobManager() }),
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('bookmark', async () => {
    const html = `<div class="page-body">
      <figure id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5"><a href="https://affine.pro/" class="bookmark source">
          <div class="bookmark-info">
            <div class="bookmark-text">
              <div class="bookmark-title">AFFiNE - All In One KnowledgeOS</div>
              <div class="bookmark-description">The universal editor that lets you work, play, present or
                create just about anything.</div>
            </div>
            <div class="bookmark-href"><img src="https://affine.pro/favicon-96.png"
                class="icon bookmark-icon" />https://affine.pro/</div>
          </div><img src="https://affine.pro/og.png" class="bookmark-image" />
        </a></figure>
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
          flavour: 'affine:bookmark',
          props: {
            type: 'card',
            url: 'https://affine.pro/',
            bookmarkTitle: 'AFFiNE - All In One KnowledgeOS',
            description:
              'The universal editor that lets you work, play, present or create just about anything.',
            icon: 'https://affine.pro/favicon-96.png',
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

  test('embeded', async () => {
    const html = `<div class="page-body">
      <figure id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5">
        <div class="source"><a href="Untitled%ed3d2ae962f5433a90499ddbd1c81ac507/README.pdf">README.pdf</a>
        </div>
      </figure>
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
          flavour: 'affine:attachment',
          props: {
            name: 'README.pdf',
            size: 0,
            type: '',
            sourceId: 'matchesReplaceMap[2]',
          },
          children: [],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter();
    const blobManager = new MemoryBlobManager();
    const key = await blobManager.set(new File([], 'README.pdf'));
    const assestsManager = new AssetsManager({ blob: blobManager });
    await assestsManager.readFromBlob(key);
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
      assets: assestsManager,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('table', async () => {
    const html = `<div class="page-body">
      <table class="collection-content">
        <thead>
          <tr>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesTitle">
                  <path
                    d="M0.637695 13.1914C1.0957 13.1914 1.32812 13 1.47852 12.5215L2.24414 10.3887H6.14746L6.90625 12.5215C7.05664 13 7.2959 13.1914 7.74707 13.1914C8.22559 13.1914 8.5332 12.9043 8.5332 12.4531C8.5332 12.2891 8.50586 12.1523 8.44434 11.9678L5.41602 3.79199C5.2041 3.21777 4.82129 2.9375 4.19922 2.9375C3.60449 2.9375 3.21484 3.21777 3.0166 3.78516L-0.0322266 12.002C-0.09375 12.1797 -0.121094 12.3232 -0.121094 12.4668C-0.121094 12.918 0.166016 13.1914 0.637695 13.1914ZM2.63379 9.12402L4.17871 4.68066H4.21973L5.76465 9.12402H2.63379ZM12.2793 13.2324C13.3115 13.2324 14.2891 12.6787 14.7129 11.8037H14.7402V12.5762C14.7471 12.9863 15.0273 13.2393 15.4238 13.2393C15.834 13.2393 16.1143 12.9795 16.1143 12.5215V8.00977C16.1143 6.49902 14.9658 5.52148 13.1543 5.52148C11.7666 5.52148 10.6592 6.08887 10.2695 6.99121C10.1943 7.15527 10.1533 7.3125 10.1533 7.46289C10.1533 7.81152 10.4062 8.04395 10.7686 8.04395C11.0215 8.04395 11.2129 7.94824 11.3496 7.73633C11.7529 6.99121 12.2861 6.65625 13.1064 6.65625C14.0977 6.65625 14.6992 7.20996 14.6992 8.1123V8.67285L12.5664 8.7959C10.7686 8.8916 9.77734 9.69824 9.77734 11.0107C9.77734 12.3369 10.8096 13.2324 12.2793 13.2324ZM12.6621 12.1387C11.8008 12.1387 11.2129 11.667 11.2129 10.9561C11.2129 10.2725 11.7598 9.82129 12.7578 9.75977L14.6992 9.62988V10.3203C14.6992 11.3457 13.7969 12.1387 12.6621 12.1387Z">
                  </path>
                </svg></span>Name</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesMultipleSelect">
                  <path
                    d="M1.91602 4.83789C2.44238 4.83789 2.87305 4.40723 2.87305 3.87402C2.87305 3.34766 2.44238 2.91699 1.91602 2.91699C1.38281 2.91699 0.952148 3.34766 0.952148 3.87402C0.952148 4.40723 1.38281 4.83789 1.91602 4.83789ZM5.1084 4.52344H14.3984C14.7607 4.52344 15.0479 4.23633 15.0479 3.87402C15.0479 3.51172 14.7607 3.22461 14.3984 3.22461H5.1084C4.74609 3.22461 4.45898 3.51172 4.45898 3.87402C4.45898 4.23633 4.74609 4.52344 5.1084 4.52344ZM1.91602 9.03516C2.44238 9.03516 2.87305 8.60449 2.87305 8.07129C2.87305 7.54492 2.44238 7.11426 1.91602 7.11426C1.38281 7.11426 0.952148 7.54492 0.952148 8.07129C0.952148 8.60449 1.38281 9.03516 1.91602 9.03516ZM5.1084 8.7207H14.3984C14.7607 8.7207 15.0479 8.43359 15.0479 8.07129C15.0479 7.70898 14.7607 7.42188 14.3984 7.42188H5.1084C4.74609 7.42188 4.45898 7.70898 4.45898 8.07129C4.45898 8.43359 4.74609 8.7207 5.1084 8.7207ZM1.91602 13.2324C2.44238 13.2324 2.87305 12.8018 2.87305 12.2686C2.87305 11.7422 2.44238 11.3115 1.91602 11.3115C1.38281 11.3115 0.952148 11.7422 0.952148 12.2686C0.952148 12.8018 1.38281 13.2324 1.91602 13.2324ZM5.1084 12.918H14.3984C14.7607 12.918 15.0479 12.6309 15.0479 12.2686C15.0479 11.9062 14.7607 11.6191 14.3984 11.6191H5.1084C4.74609 11.6191 4.45898 11.9062 4.45898 12.2686C4.45898 12.6309 4.74609 12.918 5.1084 12.918Z">
                  </path>
                </svg></span>Tags</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesMultipleSelect">
                  <path
                    d="M1.91602 4.83789C2.44238 4.83789 2.87305 4.40723 2.87305 3.87402C2.87305 3.34766 2.44238 2.91699 1.91602 2.91699C1.38281 2.91699 0.952148 3.34766 0.952148 3.87402C0.952148 4.40723 1.38281 4.83789 1.91602 4.83789ZM5.1084 4.52344H14.3984C14.7607 4.52344 15.0479 4.23633 15.0479 3.87402C15.0479 3.51172 14.7607 3.22461 14.3984 3.22461H5.1084C4.74609 3.22461 4.45898 3.51172 4.45898 3.87402C4.45898 4.23633 4.74609 4.52344 5.1084 4.52344ZM1.91602 9.03516C2.44238 9.03516 2.87305 8.60449 2.87305 8.07129C2.87305 7.54492 2.44238 7.11426 1.91602 7.11426C1.38281 7.11426 0.952148 7.54492 0.952148 8.07129C0.952148 8.60449 1.38281 9.03516 1.91602 9.03516ZM5.1084 8.7207H14.3984C14.7607 8.7207 15.0479 8.43359 15.0479 8.07129C15.0479 7.70898 14.7607 7.42188 14.3984 7.42188H5.1084C4.74609 7.42188 4.45898 7.70898 4.45898 8.07129C4.45898 8.43359 4.74609 8.7207 5.1084 8.7207ZM1.91602 13.2324C2.44238 13.2324 2.87305 12.8018 2.87305 12.2686C2.87305 11.7422 2.44238 11.3115 1.91602 11.3115C1.38281 11.3115 0.952148 11.7422 0.952148 12.2686C0.952148 12.8018 1.38281 13.2324 1.91602 13.2324ZM5.1084 12.918H14.3984C14.7607 12.918 15.0479 12.6309 15.0479 12.2686C15.0479 11.9062 14.7607 11.6191 14.3984 11.6191H5.1084C4.74609 11.6191 4.45898 11.9062 4.45898 12.2686C4.45898 12.6309 4.74609 12.918 5.1084 12.918Z">
                  </path>
                </svg></span>Multi-select</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesNumber">
                  <path
                    d="M2.4834 10.9902H4.33594L3.75488 13.8887C3.74121 13.9639 3.72754 14.0664 3.72754 14.1416C3.72754 14.5381 3.99414 14.7637 4.39746 14.7637C4.81445 14.7637 5.09473 14.5449 5.18359 14.1143L5.80566 10.9902H8.79297L8.21191 13.8887C8.19824 13.9639 8.18457 14.0664 8.18457 14.1416C8.18457 14.5381 8.45117 14.7637 8.85449 14.7637C9.27148 14.7637 9.55176 14.5449 9.63379 14.1143L10.2627 10.9902H12.4502C12.9287 10.9902 13.2432 10.6758 13.2432 10.2109C13.2432 9.8418 12.9902 9.56836 12.6006 9.56836H10.5498L11.2129 6.28711H13.3662C13.8379 6.28711 14.1523 5.96582 14.1523 5.50098C14.1523 5.13184 13.9062 4.8584 13.5098 4.8584H11.5L12.0195 2.27441C12.0264 2.21973 12.0469 2.11035 12.0469 2.01465C12.0469 1.625 11.7666 1.39258 11.3633 1.39258C10.9053 1.39258 10.6797 1.63867 10.5977 2.05566L10.0303 4.8584H7.04297L7.5625 2.27441C7.57617 2.21973 7.58984 2.11035 7.58984 2.01465C7.58984 1.625 7.30957 1.39258 6.91309 1.39258C6.44824 1.39258 6.21582 1.63867 6.13379 2.05566L5.57324 4.8584H3.54297C3.06445 4.8584 2.75 5.18652 2.75 5.65137C2.75 6.03418 3.00293 6.28711 3.39258 6.28711H5.28613L4.62305 9.56836H2.63379C2.15527 9.56836 1.84082 9.89648 1.84082 10.3613C1.84082 10.7373 2.09375 10.9902 2.4834 10.9902ZM6.09277 9.56836L6.75586 6.28711H9.74316L9.08008 9.56836H6.09277Z">
                  </path>
                </svg></span>Number</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesStatus">
                  <path
                    d="M8.75488 1.02344C8.75488 0.613281 8.41309 0.264648 8.00293 0.264648C7.59277 0.264648 7.25098 0.613281 7.25098 1.02344V3.11523C7.25098 3.51855 7.59277 3.86719 8.00293 3.86719C8.41309 3.86719 8.75488 3.51855 8.75488 3.11523V1.02344ZM3.91504 5.0293C4.20215 5.31641 4.69434 5.32324 4.97461 5.03613C5.26855 4.74902 5.26855 4.25684 4.98145 3.96973L3.53906 2.52051C3.25195 2.2334 2.7666 2.21973 2.47949 2.50684C2.19238 2.79395 2.18555 3.28613 2.47266 3.57324L3.91504 5.0293ZM10.9629 4.01758C10.6826 4.30469 10.6826 4.79688 10.9697 5.08398C11.2568 5.37109 11.749 5.36426 12.0361 5.07715L13.4854 3.62793C13.7725 3.34082 13.7725 2.84863 13.4785 2.55469C13.1982 2.27441 12.7061 2.27441 12.4189 2.56152L10.9629 4.01758ZM15.0234 8.78906C15.4336 8.78906 15.7822 8.44727 15.7822 8.03711C15.7822 7.62695 15.4336 7.28516 15.0234 7.28516H12.9385C12.5283 7.28516 12.1797 7.62695 12.1797 8.03711C12.1797 8.44727 12.5283 8.78906 12.9385 8.78906H15.0234ZM0.975586 7.28516C0.56543 7.28516 0.223633 7.62695 0.223633 8.03711C0.223633 8.44727 0.56543 8.78906 0.975586 8.78906H3.07422C3.48438 8.78906 3.83301 8.44727 3.83301 8.03711C3.83301 7.62695 3.48438 7.28516 3.07422 7.28516H0.975586ZM12.0361 10.9902C11.749 10.71 11.2568 10.71 10.9629 10.9971C10.6826 11.2842 10.6826 11.7764 10.9697 12.0635L12.4258 13.5127C12.7129 13.7998 13.2051 13.793 13.4922 13.5059C13.7793 13.2256 13.7725 12.7266 13.4854 12.4395L12.0361 10.9902ZM2.52051 12.4395C2.22656 12.7266 2.22656 13.2188 2.50684 13.5059C2.79395 13.793 3.28613 13.7998 3.57324 13.5127L5.02246 12.0703C5.31641 11.7832 5.31641 11.291 5.03613 11.0039C4.74902 10.7168 4.25684 10.71 3.96973 10.9971L2.52051 12.4395ZM8.75488 12.9658C8.75488 12.5557 8.41309 12.207 8.00293 12.207C7.59277 12.207 7.25098 12.5557 7.25098 12.9658V15.0576C7.25098 15.4609 7.59277 15.8096 8.00293 15.8096C8.41309 15.8096 8.75488 15.4609 8.75488 15.0576V12.9658Z">
                  </path>
                </svg></span>Status</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesCheckbox">
                  <path
                    d="M3.85742 14.4561H12.1357C13.6123 14.4561 14.3779 13.6904 14.3779 12.2344V3.91504C14.3779 2.45215 13.6123 1.69336 12.1357 1.69336H3.85742C2.38086 1.69336 1.61523 2.45215 1.61523 3.91504V12.2344C1.61523 13.6973 2.38086 14.4561 3.85742 14.4561ZM3.93945 13.1162C3.30371 13.1162 2.95508 12.7812 2.95508 12.1182V4.02441C2.95508 3.36133 3.30371 3.0332 3.93945 3.0332H12.0537C12.6826 3.0332 13.0381 3.36133 13.0381 4.02441V12.1182C13.0381 12.7812 12.6826 13.1162 12.0537 13.1162H3.93945ZM7.26855 11.3115C7.51465 11.3115 7.72656 11.1885 7.87012 10.9697L10.9258 6.19141C11.0146 6.04785 11.0967 5.88379 11.0967 5.72656C11.0967 5.3916 10.7959 5.16602 10.4746 5.16602C10.2695 5.16602 10.085 5.27539 9.94141 5.50781L7.24121 9.8418L5.96973 8.22168C5.80566 8.00977 5.6416 7.93457 5.43652 7.93457C5.10156 7.93457 4.8418 8.20117 4.8418 8.54297C4.8418 8.70703 4.90332 8.85742 5.01953 9.00098L6.63281 10.9697C6.81738 11.209 7.01562 11.3115 7.26855 11.3115Z">
                  </path>
                </svg></span>Checkbox</th>
          </tr>
        </thead>
        <tbody>
          <tr id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5">
            <td class="cell-title"><a
                href="https://www.notion.so/https-affine-pro-ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21">https://affine.pro</a>
            </td>
            <td class="cell-tC]_"><span class="selected-value select-value-color-red">aaa</span></td>
            <td class="cell-GFq@"><span class="selected-value select-value-color-gray">aaa</span><span
                class="selected-value select-value-color-blue">bbb</span></td>
            <td class="cell-Kruh">5</td>
            <td class="cell-S_z"><span class="status-value">
                <div class="status-dot"></div>Not started
              </span></td>
            <td class="cell-Wgk@">
              <div class="checkbox checkbox-off"></div>
            </td>
          </tr>
          <tr id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5">
            <td class="cell-title"><a
                href="https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21">Untitled</a></td>
            <td class="cell-tC]_"><span class="selected-value select-value-color-green">bbb</span></td>
            <td class="cell-GFq@"><span class="selected-value select-value-color-gray">aaa</span><span
                class="selected-value select-value-color-brown">ccc</span></td>
            <td class="cell-Kruh">7</td>
            <td class="cell-S_z"><span class="status-value">
                <div class="status-dot"></div>Not started
              </span></td>
            <td class="cell-Wgk@">
              <div class="checkbox checkbox-on"></div>
            </td>
          </tr>
          <tr id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5">
            <td class="cell-title"><a
                href="https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21">Untitled</a></td>
            <td class="cell-tC]_"><span class="selected-value select-value-color-red">aaa</span></td>
            <td class="cell-GFq@"><span class="selected-value select-value-color-blue">bbb</span></td>
            <td class="cell-Kruh">9</td>
            <td class="cell-S_z"><span class="status-value">
                <div class="status-dot"></div>Not started
              </span></td>
            <td class="cell-Wgk@">
              <div class="checkbox checkbox-off"></div>
            </td>
          </tr>
        </tbody>
      </table><br /><br />
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
          flavour: 'affine:database',
          props: {
            views: [
              {
                id: 'matchesReplaceMap[2]',
                name: 'Table View',
                mode: 'table',
                columns: [],
                filter: {
                  type: 'group',
                  op: 'and',
                  conditions: [],
                },
                header: {
                  titleColumn: 'matchesReplaceMap[4]',
                  iconColumn: 'type',
                },
              },
            ],
            title: {
              '$blocksuite:internal:text$': true,
              delta: [],
            },
            columns: [
              {
                type: 'title',
                name: '   Name',
                data: {},
                id: 'matchesReplaceMap[4]',
              },
              {
                type: 'multi-select',
                name: '   Tags',
                data: {
                  options: [
                    {
                      id: 'matchesReplaceMap[51]',
                      value: 'aaa',
                      color: 'matchesReplaceMap[6]',
                    },
                    {
                      id: 'matchesReplaceMap[37]',
                      value: 'bbb',
                      color: 'matchesReplaceMap[8]',
                    },
                  ],
                },
                id: 'matchesReplaceMap[50]',
              },
              {
                type: 'multi-select',
                name: '   Multi-select',
                data: {
                  options: [
                    {
                      id: 'matchesReplaceMap[40]',
                      value: 'aaa',
                      color: 'matchesReplaceMap[11]',
                    },
                    {
                      id: 'matchesReplaceMap[54]',
                      value: 'bbb',
                      color: 'matchesReplaceMap[13]',
                    },
                    {
                      id: 'matchesReplaceMap[41]',
                      value: 'ccc',
                      color: 'matchesReplaceMap[15]',
                    },
                  ],
                },
                id: 'matchesReplaceMap[53]',
              },
              {
                type: 'number',
                name: '   Number',
                data: {},
                id: 'matchesReplaceMap[56]',
              },
              {
                type: 'rich-text',
                name: '   Status',
                data: {},
                id: 'matchesReplaceMap[58]',
              },
              {
                type: 'checkbox',
                name: '   Checkbox',
                data: {},
                id: 'matchesReplaceMap[60]',
              },
            ],
            cells: {
              'matchesReplaceMap[20]': {
                'matchesReplaceMap[50]': {
                  columnId: 'matchesReplaceMap[50]',
                  value: ['matchesReplaceMap[51]'],
                },
                'matchesReplaceMap[53]': {
                  columnId: 'matchesReplaceMap[53]',
                  value: ['matchesReplaceMap[40]', 'matchesReplaceMap[54]'],
                },
                'matchesReplaceMap[56]': {
                  columnId: 'matchesReplaceMap[56]',
                  value: 5,
                },
                'matchesReplaceMap[58]': {
                  columnId: 'matchesReplaceMap[58]',
                  value: ' Not started ',
                },
                'matchesReplaceMap[60]': {
                  columnId: 'matchesReplaceMap[60]',
                  value: false,
                },
              },
              'matchesReplaceMap[34]': {
                'matchesReplaceMap[50]': {
                  columnId: 'matchesReplaceMap[50]',
                  value: ['matchesReplaceMap[37]'],
                },
                'matchesReplaceMap[53]': {
                  columnId: 'matchesReplaceMap[53]',
                  value: ['matchesReplaceMap[40]', 'matchesReplaceMap[41]'],
                },
                'matchesReplaceMap[56]': {
                  columnId: 'matchesReplaceMap[56]',
                  value: 7,
                },
                'matchesReplaceMap[58]': {
                  columnId: 'matchesReplaceMap[58]',
                  value: ' Not started ',
                },
                'matchesReplaceMap[60]': {
                  columnId: 'matchesReplaceMap[60]',
                  value: true,
                },
              },
              'matchesReplaceMap[48]': {
                'matchesReplaceMap[50]': {
                  columnId: 'matchesReplaceMap[50]',
                  value: ['matchesReplaceMap[51]'],
                },
                'matchesReplaceMap[53]': {
                  columnId: 'matchesReplaceMap[53]',
                  value: ['matchesReplaceMap[54]'],
                },
                'matchesReplaceMap[56]': {
                  columnId: 'matchesReplaceMap[56]',
                  value: 9,
                },
                'matchesReplaceMap[58]': {
                  columnId: 'matchesReplaceMap[58]',
                  value: ' Not started ',
                },
                'matchesReplaceMap[60]': {
                  columnId: 'matchesReplaceMap[60]',
                  value: false,
                },
              },
            },
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[61]',
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'https://affine.pro',
                      attributes: {
                        link: 'https://www.notion.so/https-affine-pro-ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                      },
                    },
                  ],
                },
                type: 'text',
              },
              children: [],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[62]',
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'Untitled',
                      attributes: {
                        link: 'https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                      },
                    },
                  ],
                },
                type: 'text',
              },
              children: [],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[63]',
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'Untitled',
                      attributes: {
                        link: 'https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                      },
                    },
                  ],
                },
                type: 'text',
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
