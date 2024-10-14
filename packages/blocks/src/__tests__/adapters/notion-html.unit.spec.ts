import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import {
  AssetsManager,
  type BlockSnapshot,
  MemoryBlobCRUD,
} from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { NotionHtmlAdapter } from '../../_common/adapters/notion-html.js';
import { nanoidReplacement } from '../../_common/test-utils/test-utils.js';
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:code',
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
          children: [],
        },
      ],
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:paragraph',
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
          flavour: 'affine:paragraph',
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
          flavour: 'affine:paragraph',
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
                  insert: '💡aaa',
                },
              ],
            },
          },
          children: [],
        },
      ],
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
      assets: new AssetsManager({ blob: new MemoryBlobCRUD() }),
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
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:bookmark',
          props: {
            type: 'card',
            url: 'https://affine.pro/',
            title: 'AFFiNE - All In One KnowledgeOS',
            description:
              'The universal editor that lets you work, play, present or create just about anything.',
            icon: 'https://affine.pro/favicon-96.png',
          },
          children: [],
        },
      ],
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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

    const adapter = new NotionHtmlAdapter(createJob());
    const blobCRUD = new MemoryBlobCRUD();
    const key = await blobCRUD.set(new File([], 'README.pdf'));
    const assestsManager = new AssetsManager({ blob: blobCRUD });
    assestsManager
      .getPathBlobIdMap()
      .set('Untitled 3d2ae962f5433a90499ddbd1c81ac507/README.pdf', key);
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
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
                name: 'Name',
                data: {},
                id: 'matchesReplaceMap[4]',
              },
              {
                type: 'multi-select',
                name: 'Tags',
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
                name: 'Multi-select',
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
                name: 'Number',
                data: {},
                id: 'matchesReplaceMap[56]',
              },
              {
                type: 'rich-text',
                name: 'Status',
                data: {},
                id: 'matchesReplaceMap[58]',
              },
              {
                type: 'checkbox',
                name: 'Checkbox',
                data: {},
                id: 'matchesReplaceMap[60]',
              },
            ],
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: 'both',
      },
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
                  titleColumn: '',
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
                type: 'rich-text',
                name: '',
                data: {},
                id: 'matchesReplaceMap[17]',
              },
              {
                type: 'rich-text',
                name: '',
                data: {},
                id: 'matchesReplaceMap[19]',
              },
            ],
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
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[20]',
              flavour: 'affine:paragraph',
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
              children: [],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[21]',
              flavour: 'affine:paragraph',
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
              children: [],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[22]',
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                type: 'text',
              },
              children: [],
            },
            {
              type: 'block',
              id: 'matchesReplaceMap[23]',
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                type: 'text',
              },
              children: [],
            },
          ],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('block equation', async () => {
    const html = `<div class="page-body">
      <figure id="11b088dd-6fdb-804f-8299-cc84de0b4909" class="equation">
        <div class="equation-container">
          <annotation encoding="application/x-tex">E = mc^2</annotation>
        </div>
      </figure>
  </div>`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [
        {
          type: 'block',
          id: 'matchesReplaceMap[1]',
          flavour: 'affine:latex',
          props: {
            latex: 'E = mc^2',
          },
          children: [],
        },
      ],
    };

    const adapter = new NotionHtmlAdapter(createJob());
    const rawBlockSnapshot = await adapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
