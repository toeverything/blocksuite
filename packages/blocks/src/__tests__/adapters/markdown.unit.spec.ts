import type {
  BlockSnapshot,
  DocSnapshot,
  JobMiddleware,
  SliceSnapshot,
} from '@blocksuite/store';

import { AssetsManager, MemoryBlobCRUD } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { MarkdownAdapter } from '../../_common/adapters/markdown.js';
import { nanoidReplacement } from '../../_common/test-utils/test-utils.js';
import { embedSyncedDocMiddleware } from '../../_common/transformers/middlewares.js';
import { NoteDisplayMode } from '../../_common/types.js';
import { createJob } from '../utils/create-job.js';

describe('snapshot to markdown', () => {
  test('code', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'block:8hOLxad5Fv',
              props: {
                language: 'python',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'import this',
                    },
                  ],
                },
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const markdown = '```python\nimport this\n```\n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('paragraph', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'block:72SMa5mdLy',
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
                  children: [
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:sP3bU52el7',
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
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:X_HMxP4wxC',
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
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:iA34Rb-RvV',
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
                  flavour: 'affine:paragraph',
                  id: 'block:f-Z6nRrGK_',
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
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'block:I0Fmz5Nv02',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ggg',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:paragraph',
              id: 'block:Bdn8Yvqcny',
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
              id: 'block:12lDwMD7ec',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'hhh',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = `aaa

&#x20;   bbb

&#x20;   ccc

&#x20;       ddd

&#x20;       eee

&#x20;       fff

&#x20;   ggg

hhh
`;

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('bulleted list', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
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
                      flavour: 'affine:list',
                      id: 'block:UyvxA_gqCJ',
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
                  id: 'block:kYliRIovvL',
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
                  id: 'block:-guNZRm5u1',
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
              id: 'block:imiLDMKSkx',
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
              id: 'block:B9CaZzQ2CO',
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
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = `* aaa
  * bbb
    * ccc
  * ddd
* eee
`;

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('todo list', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
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
                      flavour: 'affine:list',
                      id: 'block:UyvxA_gqCJ',
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
                  id: 'block:kYliRIovvL',
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
                  id: 'block:-guNZRm5u1',
                  props: {
                    checked: true,
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
              id: 'block:imiLDMKSkx',
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
              id: 'block:B9CaZzQ2CO',
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
                type: 'todo',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = `\
* [ ] aaa
  * [x] bbb
    * [ ] ccc
  * [x] ddd
* [ ] eee
`;

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('numbered list', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Y4J-oO9h9d',
          props: {
            elements: {},
          },
          type: 'block',
          version: 5,
        },
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:list',
                  id: 'block:8-GeKDc06x',
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
                  version: 1,
                },
                {
                  children: [],
                  flavour: 'affine:list',
                  id: 'block:f0c-9xKaEL',
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
                  version: 1,
                },
              ],
              flavour: 'affine:list',
              id: 'block:Fd0ZCYB7a4',
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
              version: 1,
            },
            {
              children: [],
              flavour: 'affine:list',
              id: 'block:Fd0ZCYB7a5',
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
              version: 1,
            },
          ],
          flavour: 'affine:note',
          id: 'block:1Ll22zT992',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: 'both',
            edgeless: {
              style: {
                borderRadius: 8,
                borderSize: 4,
                borderStyle: 'solid',
                shadowType: '--affine-note-shadow-box',
              },
            },
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
          version: 1,
        },
      ],
      flavour: 'affine:page',
      id: 'block:m5hvdXHXS2',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
      version: 2,
    };

    const markdown = `1. aaa
   1. bbb
   2. ccc
2. ddd
`;

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toEqual(markdown);
  });

  test('code inline', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:qhpbuss-KN',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      attributes: {
                        code: true,
                      },
                      insert: 'bbb',
                    },
                    {
                      insert: ' ccc',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = 'aaa `bbb` ccc\n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('link', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:Bdn8Yvqcny',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      attributes: {
                        link: 'https://affine.pro/',
                      },
                      insert: 'bbb',
                    },
                    {
                      insert: ' ccc',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = 'aaa [bbb](https://affine.pro/) ccc\n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('inline link', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:Bdn8Yvqcny',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      attributes: {
                        link: 'https://affine.pro/  ',
                      },
                      insert: 'https://affine.pro/  ',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = 'aaa https://affine.pro/  \n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('bold', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:zxDyvrg1Mh',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                    {
                      attributes: {
                        bold: true,
                      },
                      insert: 'bbb',
                    },
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
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const markdown = 'aaa**bbb**ccc\n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('italic', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:zxDyvrg1Mh',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                    {
                      attributes: {
                        italic: true,
                      },
                      insert: 'bbb',
                    },
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
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const markdown = 'aaa*bbb*ccc\n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('image', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:zqtuv999Ww',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:image',
              id: 'block:Gan31s-dYK',
              props: {
                caption: 'aaa',
                height: 0,
                index: 'a0',
                rotate: 0,
                sourceId: 'YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=',
                width: 0,
                xywh: '[0,0,0,0]',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:If92CIQiOl',
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
          flavour: 'affine:note',
          id: 'block:UTUZojv22c',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:WcYcyv-oZY',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const markdown =
      '![](assets/YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=.blob "aaa")\n\n';

    const mdAdapter = new MarkdownAdapter(createJob());
    const blobCRUD = new MemoryBlobCRUD();
    await blobCRUD.set(
      'YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=',
      new Blob()
    );
    const assets = new AssetsManager({ blob: blobCRUD });

    const target = await mdAdapter.fromBlockSnapshot({
      assets,
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('table', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'block:P_-Wg7Rg9O',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'Task 1',
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
          id: 'block:0vhfgcHtPF',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'Task 2',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:database',
      id: 'block:8Wb7CSJ9Qe',
      props: {
        cells: {
          'block:0vhfgcHtPF': {
            'block:5cglrBmAr3': {
              columnId: 'block:5cglrBmAr3',
              value: 1703030400000,
            },
            'block:O8dpIDiP7-': {
              columnId: 'block:O8dpIDiP7-',
              value: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'test1',
                  },
                ],
              },
            },
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
              value: 'F2bgsaE3X2',
            },
          },
          'block:P_-Wg7Rg9O': {
            'block:-DT7B0TafG': {
              columnId: 'block:-DT7B0TafG',
              value: true,
            },
            'block:5cglrBmAr3': {
              columnId: 'block:5cglrBmAr3',
              value: 1702598400000,
            },
            'block:5ej6StPuF_': {
              columnId: 'block:5ej6StPuF_',
              value: 65,
            },
            'block:8Fa0JQe7WY': {
              columnId: 'block:8Fa0JQe7WY',
              value: 1,
            },
            'block:DPhZ6JBziD': {
              columnId: 'block:DPhZ6JBziD',
              value: ['-2_QD3GZT1', '73UrEZWaKk'],
            },
            'block:O8dpIDiP7-': {
              columnId: 'block:O8dpIDiP7-',
              value: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    attributes: {
                      link: 'https://google.com',
                    },
                    insert: 'test2',
                  },
                ],
              },
            },
            'block:U8lPD59MkF': {
              columnId: 'block:U8lPD59MkF',
              value: 'https://google.com',
            },
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
              value: 'TKip9uc7Yx',
            },
          },
          'block:W_eirvg7EJ': {
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
            },
          },
          'block:b4_02QXMAM': {
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
              value: 'y3O1A2IHHu',
            },
          },
        },
        columns: [
          {
            data: {},
            id: 'block:2VfUaitjf9',
            name: 'Title',
            type: 'title',
          },
          {
            data: {
              options: [
                {
                  color: 'var(--affine-tag-white)',
                  id: 'TKip9uc7Yx',
                  value: 'TODO',
                },
                {
                  color: 'var(--affine-tag-green)',
                  id: 'F2bgsaE3X2',
                  value: 'In Progress',
                },
                {
                  color: 'var(--affine-tag-gray)',
                  id: 'y3O1A2IHHu',
                  value: 'Done',
                },
              ],
            },
            id: 'block:qyo8q9VPWU',
            name: 'Status',
            type: 'select',
          },
          {
            data: {},
            id: 'block:5cglrBmAr3',
            name: 'Date',
            type: 'date',
          },
          {
            data: {
              decimal: 0,
            },
            id: 'block:8Fa0JQe7WY',
            name: 'Number',
            type: 'number',
          },
          {
            data: {},
            id: 'block:5ej6StPuF_',
            name: 'Progress',
            type: 'progress',
          },
          {
            data: {
              options: [
                {
                  color: 'var(--affine-tag-purple)',
                  id: '73UrEZWaKk',
                  value: 'test2',
                },
                {
                  color: 'var(--affine-tag-teal)',
                  id: '-2_QD3GZT1',
                  value: 'test1',
                },
              ],
            },
            id: 'block:DPhZ6JBziD',
            name: 'MultiSelect',
            type: 'multi-select',
          },
          {
            data: {},
            id: 'block:O8dpIDiP7-',
            name: 'RichText',
            type: 'rich-text',
          },
          {
            data: {},
            id: 'block:U8lPD59MkF',
            name: 'Link',
            type: 'link',
          },
          {
            data: {},
            id: 'block:-DT7B0TafG',
            name: 'Checkbox',
            type: 'checkbox',
          },
        ],
      },
      type: 'block',
    };

    const md = `\
| Title  | Status      | Date       | Number | Progress | MultiSelect | RichText                    | Link               | Checkbox |
| ------ | ----------- | ---------- | ------ | -------- | ----------- | --------------------------- | ------------------ | -------- |
| Task 1 | TODO        | 2023-12-15 | 1      | 65       | test1,test2 | [test2](https://google.com) | https://google.com | true     |
| Task 2 | In Progress | 2023-12-20 |        |          |             | test1                       |                    |          |
`;
    const mdAdapter = new MarkdownAdapter(createJob());
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(md);
  });

  test('reference', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'block:72SMa5mdLy',
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
                  children: [
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:sP3bU52el7',
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
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:X_HMxP4wxC',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'eee',
                            },
                            {
                              attributes: {
                                reference: {
                                  pageId: 'deadbeef',
                                  type: 'LinkedPage',
                                },
                              },
                              insert: '',
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
                      id: 'block:iA34Rb-RvV',
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
                  flavour: 'affine:paragraph',
                  id: 'block:f-Z6nRrGK_',
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
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'block:I0Fmz5Nv02',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ggg',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:paragraph',
              id: 'block:Bdn8Yvqcny',
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
              id: 'block:12lDwMD7ec',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'hhh',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const markdown = `aaa

&#x20;   bbb

&#x20;   ccc

&#x20;       ddd

&#x20;       eeetest

&#x20;       fff

&#x20;   ggg

hhh
`;
    const middleware: JobMiddleware = ({ adapterConfigs }) => {
      adapterConfigs.set('title:deadbeef', 'test');
    };
    const mdAdapter = new MarkdownAdapter(createJob([middleware]));
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('synced-doc', async () => {
    // doc -> synced doc block -> deepest synced doc block
    // The deepest synced doc block only export it's title

    const deepestSyncedDocSnapshot: DocSnapshot = {
      blocks: {
        children: [
          {
            children: [],
            flavour: 'affine:surface',
            id: 'zVN1EZFuZe',
            props: {
              elements: {},
            },
            type: 'block',
            version: 5,
          },
          {
            children: [
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'vNp5XrR5yw',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [],
                  },
                  type: 'text',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'JTdfSl1ygZ',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Hello, This is deepest doc.',
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
                version: 1,
              },
            ],
            flavour: 'affine:note',
            id: '2s9sJlphLH',
            props: {
              background: '--affine-background-secondary-color',
              displayMode: 'both',
              edgeless: {
                style: {
                  borderRadius: 8,
                  borderSize: 4,
                  borderStyle: 'solid',
                  shadowType: '--affine-note-shadow-box',
                },
              },
              hidden: false,
              index: 'a0',
              xywh: '[0,0,800,95]',
            },
            type: 'block',
            version: 1,
          },
        ],
        flavour: 'affine:page',
        id: '8WdJmN5FTT',
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: [
              {
                insert: 'Deepest Doc',
              },
            ],
          },
        },
        type: 'block',
        version: 2,
      },
      meta: {
        createDate: 1715762171116,
        id: 'deepestSyncedDoc',
        tags: [],
        title: 'Deepest Doc',
      },
      type: 'page',
    };

    const syncedDocSnapshot: DocSnapshot = {
      blocks: {
        children: [
          {
            children: [],
            flavour: 'affine:surface',
            id: 'gfVzx5tGpB',
            props: {
              elements: {},
            },
            type: 'block',
            version: 5,
          },
          {
            children: [
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'yFlNufsgke',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Heading 1',
                      },
                    ],
                  },
                  type: 'h1',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'oMuLcD6XS3',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'heading 2',
                      },
                    ],
                  },
                  type: 'h2',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'PQ8FhGV6VM',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'paragraph',
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'sA9paSrdEN',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        attributes: {
                          strike: true,
                        },
                        insert: 'strike',
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:code',
                id: 'DF26giFpKX',
                props: {
                  caption: '',
                  language: 'cpp',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Hello world!',
                      },
                    ],
                  },
                  wrap: false,
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:embed-synced-doc',
                id: '-3bbVQTvI2',
                props: {
                  index: 'a0',
                  pageId: 'deepestSyncedDoc',
                  rotate: 0,
                  style: 'syncedDoc',
                  xywh: '[0,0,0,0]',
                },
                type: 'block',
                version: 1,
              },
            ],
            flavour: 'affine:note',
            id: 'CzEfaUret4',
            props: {
              background: '--affine-note-background-blue',
              displayMode: 'both',
              edgeless: {
                style: {
                  borderRadius: 0,
                  borderSize: 4,
                  borderStyle: 'none',
                  shadowType: '--affine-note-shadow-sticker',
                },
              },
              hidden: false,
              index: 'a0',
              xywh: '[0,0,800,95]',
            },
            type: 'block',
            version: 1,
          },
        ],
        flavour: 'affine:page',
        id: 'AGOahFisBN',
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: [
              {
                insert: 'Synced Doc',
              },
            ],
          },
        },
        type: 'block',
        version: 2,
      },
      meta: {
        createDate: 1719212435051,
        id: 'syncedDoc',
        tags: [],
        title: 'Synced Doc',
      },
      type: 'page',
    };

    const syncedDocMd =
      '# Synced Doc\n\n# Heading 1\n\n## heading 2\n\nparagraph\n\n~~strike~~\n\n```cpp\nHello world!\n```';

    const docSnapShot: DocSnapshot = {
      blocks: {
        children: [
          {
            children: [],
            flavour: 'affine:surface',
            id: 'uRj8gejH4d',
            props: {
              elements: {},
            },
            type: 'block',
            version: 5,
          },
          {
            children: [
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'cWBI4UGTqh',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Hello',
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:embed-synced-doc',
                id: 'AqFoVxas19',
                props: {
                  index: 'a0',
                  pageId: 'syncedDoc',
                  rotate: 0,
                  style: 'syncedDoc',
                  xywh: '[0,0,0,0]',
                },
                type: 'block',
                version: 1,
              },
              {
                children: [],
                flavour: 'affine:paragraph',
                id: 'Db976U9v18',
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'World!',
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
                version: 1,
              },
            ],
            flavour: 'affine:note',
            id: 'AqFoVDUoW9',
            props: {
              background: '--affine-note-background-blue',
              displayMode: 'both',
              edgeless: {
                style: {
                  borderRadius: 0,
                  borderSize: 4,
                  borderStyle: 'none',
                  shadowType: '--affine-note-shadow-sticker',
                },
              },
              hidden: false,
              index: 'a0',
              xywh: '[0,0,800,95]',
            },
            type: 'block',
            version: 1,
          },
        ],
        flavour: 'affine:page',
        id: 'VChAZIX7DM',
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: [
              {
                insert: 'Test Doc',
              },
            ],
          },
        },
        type: 'block',
        version: 2,
      },
      meta: {
        createDate: 1719222172042,
        id: 'y5nsrywQtr',
        tags: [],
        title: 'Test Doc',
      },
      type: 'page',
    };

    const docMd = `\
# Test Doc

Hello

${syncedDocMd}

Deepest Doc

World!
`;

    const job = createJob([embedSyncedDocMiddleware('content')]);

    // workaround for adding docs to collection
    await job.snapshotToDoc(deepestSyncedDocSnapshot);
    await job.snapshotToDoc(syncedDocSnapshot);
    await job.snapshotToDoc(docSnapShot);

    const mdAdapter = new MarkdownAdapter(job);
    const target = await mdAdapter.fromDocSnapshot({
      snapshot: docSnapShot,
    });
    expect(target.file).toBe(docMd);
  });
});

describe('markdown to snapshot', () => {
  test('code', async () => {
    const markdown = '```python\nimport this\n```\n';

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:code',
          id: 'matchesReplaceMap[1]',
          props: {
            language: 'python',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'import this',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('code with indentation 1 - slice', async () => {
    const markdown = '```python\n    import this\n```';

    const sliceSnapshot: SliceSnapshot = {
      content: [
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'matchesReplaceMap[1]',
              props: {
                language: 'python',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: '    import this',
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
            displayMode: 'both',
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      pageId: '',
      pageVersion: 0,
      type: 'slice',
      workspaceId: '',
      workspaceVersion: 0,
    };

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawSliceSnapshot = await mdAdapter.toSliceSnapshot({
      file: markdown,
      pageId: '',
      pageVersion: 0,
      workspaceId: '',
      workspaceVersion: 0,
    });
    expect(nanoidReplacement(rawSliceSnapshot!)).toEqual(sliceSnapshot);
  });

  test('code with indentation 2 - slice', async () => {
    const markdown = '````python\n```python\n    import this\n```\n````';

    const sliceSnapshot: SliceSnapshot = {
      content: [
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'matchesReplaceMap[1]',
              props: {
                language: 'python',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: '```python\n    import this\n```',
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
            displayMode: 'both',
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      pageId: '',
      pageVersion: 0,
      type: 'slice',
      workspaceId: '',
      workspaceVersion: 0,
    };

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawSliceSnapshot = await mdAdapter.toSliceSnapshot({
      file: markdown,
      pageId: '',
      pageVersion: 0,
      workspaceId: '',
      workspaceVersion: 0,
    });
    expect(nanoidReplacement(rawSliceSnapshot!)).toEqual(sliceSnapshot);
  });

  test('code with indentation 3 - slice', async () => {
    const markdown = '~~~~python\n````python\n    import this\n````\n~~~~';

    const sliceSnapshot: SliceSnapshot = {
      content: [
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'matchesReplaceMap[1]',
              props: {
                language: 'python',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: '````python\n    import this\n````',
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
            displayMode: 'both',
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      pageId: '',
      pageVersion: 0,
      type: 'slice',
      workspaceId: '',
      workspaceVersion: 0,
    };

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawSliceSnapshot = await mdAdapter.toSliceSnapshot({
      file: markdown,
      pageId: '',
      pageVersion: 0,
      workspaceId: '',
      workspaceVersion: 0,
    });
    expect(nanoidReplacement(rawSliceSnapshot!)).toEqual(sliceSnapshot);
  });

  test('paragraph', async () => {
    const markdown = `aaa

&#x20;   bbb

&#x20;   ccc

&#x20;       ddd

&#x20;       eee

&#x20;       fff

&#x20;   ggg

hhh
`;

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
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[2]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '    bbb',
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
          id: 'matchesReplaceMap[3]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '    ccc',
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
                  insert: '        ddd',
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
                  insert: '        eee',
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
          id: 'matchesReplaceMap[6]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '        fff',
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
          id: 'matchesReplaceMap[7]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '    ggg',
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
          id: 'matchesReplaceMap[8]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'hhh',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('bulleted list', async () => {
    const markdown = `* aaa

  * bbb

    * ccc

  - ddd

- eee
`;

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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('todo list', async () => {
    const markdown = `- [ ] aaa

  - [x] bbb

    - [ ] ccc

  - [x] ddd

- [ ] eee
`;

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
                    type: 'todo',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:list',
              id: 'matchesReplaceMap[2]',
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
              id: 'matchesReplaceMap[4]',
              props: {
                checked: true,
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
            type: 'todo',
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
            type: 'todo',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('code inline', async () => {
    const markdown = 'aaa `bbb` ccc\n';
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
                  insert: 'aaa ',
                },
                {
                  attributes: {
                    code: true,
                  },
                  insert: 'bbb',
                },
                {
                  insert: ' ccc',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('code inline - slice', async () => {
    const markdown = '``` ```\n    aaa';

    const sliceSnapshot: SliceSnapshot = {
      content: [
        {
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
                        code: true,
                      },
                      insert: ' ',
                    },
                    {
                      insert: '\n    aaa',
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
            displayMode: 'both',
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      pageId: '',
      pageVersion: 0,
      type: 'slice',
      workspaceId: '',
      workspaceVersion: 0,
    };

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawSliceSnapshot = await mdAdapter.toSliceSnapshot({
      file: markdown,
      pageId: '',
      pageVersion: 0,
      workspaceId: '',
      workspaceVersion: 0,
    });
    expect(nanoidReplacement(rawSliceSnapshot!)).toEqual(sliceSnapshot);
  });

  test('link', async () => {
    const markdown = 'aaa [bbb](https://affine.pro/) ccc\n';
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
                  insert: 'aaa ',
                },
                {
                  attributes: {
                    link: 'https://affine.pro/',
                  },
                  insert: 'bbb',
                },
                {
                  insert: ' ccc',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('inline link', async () => {
    const markdown = 'aaa https://affine.pro/ ccc\n';
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
                  insert: 'aaa ',
                },
                {
                  attributes: {
                    link: 'https://affine.pro/',
                  },
                  insert: 'https://affine.pro/',
                },
                {
                  insert: ' ccc',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('bold', async () => {
    const markdown = 'aaa**bbb**ccc\n';

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
                {
                  attributes: {
                    bold: true,
                  },
                  insert: 'bbb',
                },
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('italic', async () => {
    const markdown = 'aaa*bbb*ccc\n';

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
                {
                  attributes: {
                    italic: true,
                  },
                  insert: 'bbb',
                },
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('table', async () => {
    const markdown = `| aaa | bbb | ccc |
| --- | --- | --- |
| ddd | eee | fff |
`;

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'matchesReplaceMap[12]',
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
          flavour: 'affine:database',
          id: 'matchesReplaceMap[1]',
          props: {
            cells: {
              'matchesReplaceMap[12]': {
                'matchesReplaceMap[10]': {
                  columnId: 'matchesReplaceMap[10]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'eee',
                      },
                    ],
                  },
                },
                'matchesReplaceMap[11]': {
                  columnId: 'matchesReplaceMap[11]',
                  value: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'fff',
                      },
                    ],
                  },
                },
              },
            },
            columns: [
              {
                data: {},
                id: 'matchesReplaceMap[9]',
                name: 'aaa',
                type: 'title',
              },
              {
                data: {},
                id: 'matchesReplaceMap[10]',
                name: 'bbb',
                type: 'rich-text',
              },
              {
                data: {},
                id: 'matchesReplaceMap[11]',
                name: 'ccc',
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
                  titleColumn: 'matchesReplaceMap[9]',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('html tag', async () => {
    const markdown = `<aaa>\n`;

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
                  insert: '<aaa>',
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

    const mdAdapter = new MarkdownAdapter(createJob());
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
