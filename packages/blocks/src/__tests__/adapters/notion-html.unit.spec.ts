import {
  AssetsManager,
  type BlockSnapshot,
  MemoryBlobCRUD,
} from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { NotionHtmlAdapter } from '../../_common/adapters/notion-html.js';
import { nanoidReplacement } from '../../_common/test-utils/test-utils.js';
import { NoteDisplayMode } from '../../_common/types.js';
import { createJob } from '../utils/create-job.js';

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
      children: [
        {
          children: [],
          flavour: 'affine:code',
          id: 'matchesReplaceMap[1]',
          props: {
            language: 'Plain Text',
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
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'matchesReplaceMap[3]',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[2]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[4]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[5]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };
    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '1',
                },
              ],
            },
            type: 'h1',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[2]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '2',
                },
              ],
            },
            type: 'h2',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[3]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '3',
                },
              ],
            },
            type: 'h3',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:list',
                  id: 'matchesReplaceMap[3]',
                  props: {
                    checked: false,
                    collapsed: false,
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    type: 'bulleted',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[2]',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                type: 'bulleted',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[4]',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                type: 'bulleted',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[1]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'bulleted',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[5]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            type: 'bulleted',
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:list',
                  id: 'matchesReplaceMap[8]',
                  props: {
                    checked: false,
                    collapsed: false,
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    type: 'todo',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[7]',
              props: {
                checked: true,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                type: 'todo',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[9]',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                type: 'todo',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[6]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'todo',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[10]',
          props: {
            checked: true,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            type: 'todo',
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:list',
                  id: 'matchesReplaceMap[13]',
                  props: {
                    checked: false,
                    collapsed: false,
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    type: 'numbered',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[12]',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                type: 'numbered',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[14]',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                type: 'numbered',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[11]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'numbered',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[15]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            type: 'numbered',
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'matchesReplaceMap[19]',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'ddd',
                            },
                          ],
                        },
                        type: 'text',
                      },
                      type: 'block',
                    },
                  ],
                  flavour: 'affine:list',
                  id: 'matchesReplaceMap[18]',
                  props: {
                    checked: false,
                    collapsed: false,
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    type: 'toggle',
                  },
                  type: 'block',
                },
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'matchesReplaceMap[20]',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'eee',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[17]',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'bbb',
                    },
                  ],
                },
                type: 'toggle',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[21]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'fff',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[16]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'toggle',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'quote',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[2]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'bbb',
                },
              ],
            },
            type: 'quote',
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[4]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'ddd',
                    },
                  ],
                },
                type: 'quote',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[3]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'ccc',
                },
              ],
            },
            type: 'quote',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '💡aaa',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:divider',
          id: 'matchesReplaceMap[2]',
          props: {},
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[3]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'bbb',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
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
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  attributes: {
                    link: 'https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                  },
                  insert: 'Untitled',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('image', async () => {
    const html = `<div class="page-body">
      <figure id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5" class="image"><a
          href="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo.svg"><img src="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo.svg" /></a>
      </figure>
    </div>`;

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:image',
          id: 'matchesReplaceMap[1]',
          props: {
            sourceId: 'matchesReplaceMap[2]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      assets: new AssetsManager({ blob: new MemoryBlobCRUD() }),
      file: html,
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
      children: [
        {
          children: [],
          flavour: 'affine:bookmark',
          id: 'matchesReplaceMap[1]',
          props: {
            description:
              'The universal editor that lets you work, play, present or create just about anything.',
            icon: 'https://affine.pro/favicon-96.png',
            title: 'AFFiNE - All In One KnowledgeOS',
            type: 'card',
            url: 'https://affine.pro/',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('embeded', async () => {
    const html = `<div class="page-body">
      <figure id="ed3d2ae9-62f5-433a-9049-9ddbd1c81ac5">
        <div class="source"><a href="Untitled%203d2ae962f5433a90499ddbd1c81ac507/README.pdf">README.pdf</a>
        </div>
      </figure>
    </div>`;

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:attachment',
          id: 'matchesReplaceMap[1]',
          props: {
            name: 'README.pdf',
            size: 0,
            sourceId: 'matchesReplaceMap[2]',
            type: '',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const blobCRUD = new MemoryBlobCRUD();
    const key = await blobCRUD.set(new File([], 'README.pdf'));
    const assestsManager = new AssetsManager({ blob: blobCRUD });
    await assestsManager.readFromBlob(key);
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      assets: assestsManager,
      file: html,
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
                </svg></span>Name</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesMultipleSelect">
                </svg></span>Tags</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesMultipleSelect">
                </svg></span>Multi-select</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesNumber">
                </svg></span>Number</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesStatus">
                </svg></span>Status</th>
            <th><span class="icon property-icon"><svg role="graphics-symbol" viewBox="0 0 16 16"
                  style="width:14px;height:14px;display:block;fill:rgba(55, 53, 47, 0.45);flex-shrink:0"
                  class="typesCheckbox">
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
      children: [
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[61]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      attributes: {
                        link: 'https://www.notion.so/https-affine-pro-ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                      },
                      insert: 'https://affine.pro',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[62]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      attributes: {
                        link: 'https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                      },
                      insert: 'Untitled',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[63]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      attributes: {
                        link: 'https://www.notion.so/ed3d2ae962f5433a90499ddbd1c81ac5?pvs=21',
                      },
                      insert: 'Untitled',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:database',
          id: 'matchesReplaceMap[1]',
          props: {
            cells: {
              'matchesReplaceMap[61]': {
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
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: ' Not started ',
                      },
                    ],
                  },
                },
                'matchesReplaceMap[60]': {
                  columnId: 'matchesReplaceMap[60]',
                  value: false,
                },
              },
              'matchesReplaceMap[62]': {
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
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: ' Not started ',
                      },
                    ],
                  },
                },
                'matchesReplaceMap[60]': {
                  columnId: 'matchesReplaceMap[60]',
                  value: true,
                },
              },
              'matchesReplaceMap[63]': {
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
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: ' Not started ',
                      },
                    ],
                  },
                },
                'matchesReplaceMap[60]': {
                  columnId: 'matchesReplaceMap[60]',
                  value: false,
                },
              },
            },
            columns: [
              {
                data: {},
                id: 'matchesReplaceMap[4]',
                name: 'Name',
                type: 'title',
              },
              {
                data: {
                  options: [
                    {
                      color: 'matchesReplaceMap[6]',
                      id: 'matchesReplaceMap[51]',
                      value: 'aaa',
                    },
                    {
                      color: 'matchesReplaceMap[8]',
                      id: 'matchesReplaceMap[37]',
                      value: 'bbb',
                    },
                  ],
                },
                id: 'matchesReplaceMap[50]',
                name: 'Tags',
                type: 'multi-select',
              },
              {
                data: {
                  options: [
                    {
                      color: 'matchesReplaceMap[11]',
                      id: 'matchesReplaceMap[40]',
                      value: 'aaa',
                    },
                    {
                      color: 'matchesReplaceMap[13]',
                      id: 'matchesReplaceMap[54]',
                      value: 'bbb',
                    },
                    {
                      color: 'matchesReplaceMap[15]',
                      id: 'matchesReplaceMap[41]',
                      value: 'ccc',
                    },
                  ],
                },
                id: 'matchesReplaceMap[53]',
                name: 'Multi-select',
                type: 'multi-select',
              },
              {
                data: {},
                id: 'matchesReplaceMap[56]',
                name: 'Number',
                type: 'number',
              },
              {
                data: {},
                id: 'matchesReplaceMap[58]',
                name: 'Status',
                type: 'rich-text',
              },
              {
                data: {},
                id: 'matchesReplaceMap[60]',
                name: 'Checkbox',
                type: 'checkbox',
              },
            ],
            title: {
              '$blocksuite:internal:text$': true,
              delta: [],
            },
            views: [
              {
                columns: [],
                filter: {
                  conditions: [],
                  op: 'and',
                  type: 'group',
                },
                header: {
                  iconColumn: 'type',
                  titleColumn: 'matchesReplaceMap[4]',
                },
                id: 'matchesReplaceMap[2]',
                mode: 'table',
                name: 'Table View',
              },
            ],
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('plain table', async () => {
    const html = `<div class="page-body">
    <table id="511819ef-9f6a-4aff-9d11-174e04311b6e" class="simple-table"><tbody><tr id="2d1f2bc0-8c5f-457f-b248-b30096c2d4dd"><td id="ldE" class="">aa</td><td id="KwQz" class=""></td></tr><tr id="459350cc-7a96-44bf-8859-b74d7f4df29d"><td id="ldE" class="">1</td><td id="KwQz" class=""></td></tr><tr id="1425a8de-12d0-4aa1-b120-2bff9eeb4ee8"><td id="ldE" class=""></td><td id="KwQz" class=""></td></tr></tbody></table>
    </div>`;

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[20]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aa',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[21]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aa',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[22]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[23]',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:database',
          id: 'matchesReplaceMap[1]',
          props: {
            cells: {
              'matchesReplaceMap[20]': {
                'matchesReplaceMap[17]': {
                  columnId: 'matchesReplaceMap[17]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'aa',
                      },
                    ],
                  },
                },
                'matchesReplaceMap[19]': {
                  columnId: 'matchesReplaceMap[19]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [],
                  },
                },
              },
              'matchesReplaceMap[21]': {
                'matchesReplaceMap[17]': {
                  columnId: 'matchesReplaceMap[17]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: '1',
                      },
                    ],
                  },
                },
                'matchesReplaceMap[19]': {
                  columnId: 'matchesReplaceMap[19]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [],
                  },
                },
              },
              'matchesReplaceMap[22]': {
                'matchesReplaceMap[17]': {
                  columnId: 'matchesReplaceMap[17]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [],
                  },
                },
                'matchesReplaceMap[19]': {
                  columnId: 'matchesReplaceMap[19]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [],
                  },
                },
              },
            },
            columns: [
              {
                data: {},
                id: 'matchesReplaceMap[17]',
                name: '',
                type: 'rich-text',
              },
              {
                data: {},
                id: 'matchesReplaceMap[19]',
                name: '',
                type: 'rich-text',
              },
            ],
            title: {
              '$blocksuite:internal:text$': true,
              delta: [],
            },
            views: [
              {
                columns: [],
                filter: {
                  conditions: [],
                  op: 'and',
                  type: 'group',
                },
                header: {
                  iconColumn: 'type',
                  titleColumn: '',
                },
                id: 'matchesReplaceMap[2]',
                mode: 'table',
                name: 'Table View',
              },
            ],
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: 'both',
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
