import type { BlockSnapshot } from '@blocksuite/store';
import { MemoryBlobManager } from '@blocksuite/store';
import { AssetsManager } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { MarkdownAdapter } from '../../_common/adapters/markdown.js';
import { nanoidReplacement } from '../../_common/test-utils/test-utils.js';
import { NoteDisplayMode } from '../../_common/types.js';

describe('snapshot to markdown', () => {
  test('code', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:8hOLxad5Fv',
              flavour: 'affine:code',
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
              children: [],
            },
          ],
        },
      ],
    };

    const markdown = '```python\nimport this\n```\n';

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('paragraph', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:Bdn8Yvqcny',
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
                  id: 'block:72SMa5mdLy',
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
                {
                  type: 'block',
                  id: 'block:f-Z6nRrGK_',
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
                  children: [
                    {
                      type: 'block',
                      id: 'block:sP3bU52el7',
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
                    {
                      type: 'block',
                      id: 'block:X_HMxP4wxC',
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
                    {
                      type: 'block',
                      id: 'block:iA34Rb-RvV',
                      flavour: 'affine:paragraph',
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
                      children: [],
                    },
                  ],
                },
                {
                  type: 'block',
                  id: 'block:I0Fmz5Nv02',
                  flavour: 'affine:paragraph',
                  props: {
                    type: 'text',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ggg',
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
              id: 'block:12lDwMD7ec',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'hhh',
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
    const markdown = `aaa

&#x20;   bbb

&#x20;   ccc

&#x20;       ddd

&#x20;       eee

&#x20;       fff

&#x20;   ggg

hhh
`;

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('bulleted list', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:imiLDMKSkx',
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
                  id: 'block:kYliRIovvL',
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
                      id: 'block:UyvxA_gqCJ',
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
                  id: 'block:-guNZRm5u1',
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
              id: 'block:B9CaZzQ2CO',
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
          ],
        },
      ],
    };
    const markdown = `* aaa
  * bbb
    * ccc
  * ddd
* eee
`;

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  // TODO(@fourdim): fix this test
  test('todo list', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:imiLDMKSkx',
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
                  id: 'block:kYliRIovvL',
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
                      id: 'block:UyvxA_gqCJ',
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
                  id: 'block:-guNZRm5u1',
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
                    checked: true,
                    collapsed: false,
                  },
                  children: [],
                },
              ],
            },
            {
              type: 'block',
              id: 'block:B9CaZzQ2CO',
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
                checked: false,
                collapsed: false,
              },
              children: [],
            },
          ],
        },
      ],
    };
    const markdown = `* [ ] aaa
  * [x] bbb
    * [ ] ccc
  - [x] ddd

- [ ] eee
`;

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('numbered list', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:m5hvdXHXS2',
      flavour: 'affine:page',
      version: 2,
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Y4J-oO9h9d',
          flavour: 'affine:surface',
          version: 5,
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:1Ll22zT992',
          flavour: 'affine:note',
          version: 1,
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: 'both',
            edgeless: {
              style: {
                borderRadius: 8,
                borderSize: 4,
                borderStyle: 'solid',
                shadowType: '--affine-note-shadow-box',
              },
            },
          },
          children: [
            {
              type: 'block',
              id: 'block:Fd0ZCYB7a4',
              flavour: 'affine:list',
              version: 1,
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
                  id: 'block:8-GeKDc06x',
                  flavour: 'affine:list',
                  version: 1,
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
                  children: [],
                },
                {
                  type: 'block',
                  id: 'block:f0c-9xKaEL',
                  flavour: 'affine:list',
                  version: 1,
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
              id: 'block:Fd0ZCYB7a5',
              flavour: 'affine:list',
              version: 1,
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
      ],
    };

    const markdown = `1. aaa
   1. bbb
   2. ccc
2. ddd
`;

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toEqual(markdown);
  });

  test('code inline', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:qhpbuss-KN',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      insert: 'bbb',
                      attributes: {
                        code: true,
                      },
                    },
                    {
                      insert: ' ccc',
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
    const markdown = 'aaa `bbb` ccc\n';

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('link', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:Bdn8Yvqcny',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      insert: 'bbb',
                      attributes: {
                        link: 'https://affine.pro/',
                      },
                    },
                    {
                      insert: ' ccc',
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
    const markdown = 'aaa [bbb](https://affine.pro/) ccc\n';

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('inline link', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:Bdn8Yvqcny',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      insert: 'https://affine.pro/  ',
                      attributes: {
                        link: 'https://affine.pro/  ',
                      },
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
    const markdown = 'aaa https://affine.pro/  \n';

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('bold', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:zxDyvrg1Mh',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                    {
                      insert: 'bbb',
                      attributes: {
                        bold: true,
                      },
                    },
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
      ],
    };

    const markdown = 'aaa**bbb**ccc\n';

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('italic', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:vu6SK6WJpW',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:Tk4gSPocAt',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:WfnS5ZDCJT',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:zxDyvrg1Mh',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                    {
                      insert: 'bbb',
                      attributes: {
                        italic: true,
                      },
                    },
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
      ],
    };

    const markdown = 'aaa*bbb*ccc\n';

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(markdown);
  });

  test('image', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:WcYcyv-oZY',
      flavour: 'affine:page',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      children: [
        {
          type: 'block',
          id: 'block:zqtuv999Ww',
          flavour: 'affine:surface',
          props: {
            elements: {},
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:UTUZojv22c',
          flavour: 'affine:note',
          props: {
            xywh: '[0,0,800,95]',
            background: '--affine-background-secondary-color',
            index: 'a0',
            hidden: false,
            displayMode: NoteDisplayMode.DocAndEdgeless,
          },
          children: [
            {
              type: 'block',
              id: 'block:Gan31s-dYK',
              flavour: 'affine:image',
              props: {
                sourceId: 'YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=',
                caption: 'aaa',
                width: 0,
                height: 0,
                index: 'a0',
                xywh: '[0,0,0,0]',
                rotate: 0,
              },
              children: [],
            },
            {
              type: 'block',
              id: 'block:If92CIQiOl',
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
              },
              children: [],
            },
          ],
        },
      ],
    };

    const markdown =
      '![](assets/YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=.blob "aaa")\n\n';

    const mdAdapter = new MarkdownAdapter();
    const blobManager = new MemoryBlobManager();
    await blobManager.set(
      new Blob(),
      'YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs='
    );
    const assets = new AssetsManager({ blob: blobManager });

    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
      assets,
    });
    expect(target.file).toBe(markdown);
  });

  test('table', async () => {
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'block:8Wb7CSJ9Qe',
      flavour: 'affine:database',
      props: {
        cells: {
          'block:P_-Wg7Rg9O': {
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
              value: 'TKip9uc7Yx',
            },
            'block:5cglrBmAr3': {
              columnId: 'block:5cglrBmAr3',
              value: 1702598400000,
            },
            'block:8Fa0JQe7WY': {
              columnId: 'block:8Fa0JQe7WY',
              value: 1,
            },
            'block:5ej6StPuF_': {
              columnId: 'block:5ej6StPuF_',
              value: 65,
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
                    insert: 'test2',
                  },
                ],
              },
            },
            'block:U8lPD59MkF': {
              columnId: 'block:U8lPD59MkF',
              value: 'https://google.com',
            },
            'block:-DT7B0TafG': {
              columnId: 'block:-DT7B0TafG',
              value: true,
            },
          },
          'block:0vhfgcHtPF': {
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
              value: 'F2bgsaE3X2',
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
            'block:5cglrBmAr3': {
              columnId: 'block:5cglrBmAr3',
              value: 1703030400000,
            },
          },
          'block:b4_02QXMAM': {
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
              value: 'y3O1A2IHHu',
            },
          },
          'block:W_eirvg7EJ': {
            'block:qyo8q9VPWU': {
              columnId: 'block:qyo8q9VPWU',
            },
          },
        },
        columns: [
          {
            type: 'title',
            name: 'Title',
            data: {},
            id: 'block:2VfUaitjf9',
          },
          {
            type: 'select',
            name: 'Status',
            data: {
              options: [
                {
                  id: 'TKip9uc7Yx',
                  color: 'var(--affine-tag-white)',
                  value: 'TODO',
                },
                {
                  id: 'F2bgsaE3X2',
                  color: 'var(--affine-tag-green)',
                  value: 'In Progress',
                },
                {
                  id: 'y3O1A2IHHu',
                  color: 'var(--affine-tag-gray)',
                  value: 'Done',
                },
              ],
            },
            id: 'block:qyo8q9VPWU',
          },
          {
            type: 'date',
            name: 'Date',
            data: {},
            id: 'block:5cglrBmAr3',
          },
          {
            type: 'number',
            name: 'Number',
            data: {
              decimal: 0,
            },
            id: 'block:8Fa0JQe7WY',
          },
          {
            type: 'progress',
            name: 'Progress',
            data: {},
            id: 'block:5ej6StPuF_',
          },
          {
            type: 'multi-select',
            name: 'MultiSelect',
            data: {
              options: [
                {
                  id: '73UrEZWaKk',
                  value: 'test2',
                  color: 'var(--affine-tag-purple)',
                },
                {
                  id: '-2_QD3GZT1',
                  value: 'test1',
                  color: 'var(--affine-tag-teal)',
                },
              ],
            },
            id: 'block:DPhZ6JBziD',
          },
          {
            type: 'rich-text',
            name: 'RichText',
            data: {},
            id: 'block:O8dpIDiP7-',
          },
          {
            type: 'link',
            name: 'Link',
            data: {},
            id: 'block:U8lPD59MkF',
          },
          {
            type: 'checkbox',
            name: 'Checkbox',
            data: {},
            id: 'block:-DT7B0TafG',
          },
        ],
      },
      children: [
        {
          type: 'block',
          id: 'block:P_-Wg7Rg9O',
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'Task 1',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'block:0vhfgcHtPF',
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'Task 2',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const md = `| Title  | Status      | Date       | Number | Progress | MultiSelect | RichText | Link               | Checkbox |\n| ------ | ----------- | ---------- | ------ | -------- | ----------- | -------- | ------------------ | -------- |\n| Task 1 | TODO        | 2023-12-15 | 1      | 65       | test1,test2 | test2    | https://google.com | true     |\n| Task 2 | In Progress | 2023-12-20 |        |          |             | test1    |                    |          |\n`;
    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(md);
  });
});

describe('markdown to snapshot', () => {
  test('code', async () => {
    const markdown = '```python\nimport this\n```\n';

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '    bbb',
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
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '    ccc',
                },
              ],
            },
          },
          children: [],
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
                  insert: '        ddd',
                },
              ],
            },
          },
          children: [],
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
                  insert: '        eee',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[6]',
          flavour: 'affine:paragraph',
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
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[7]',
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: '    ggg',
                },
              ],
            },
          },
          children: [],
        },
        {
          type: 'block',
          id: 'matchesReplaceMap[8]',
          flavour: 'affine:paragraph',
          props: {
            type: 'text',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'hhh',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
      ],
    };

    const mdAdapter = new MarkdownAdapter();
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
              id: 'matchesReplaceMap[2]',
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
                  id: 'matchesReplaceMap[3]',
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
              id: 'matchesReplaceMap[4]',
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
                checked: true,
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
            type: 'todo',
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
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('code inline', async () => {
    const markdown = 'aaa `bbb` ccc\n';
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
                  insert: 'aaa ',
                },
                {
                  insert: 'bbb',
                  attributes: {
                    code: true,
                  },
                },
                {
                  insert: ' ccc',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('link', async () => {
    const markdown = 'aaa [bbb](https://affine.pro/) ccc\n';
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
                  insert: 'aaa ',
                },
                {
                  insert: 'bbb',
                  attributes: {
                    link: 'https://affine.pro/',
                  },
                },
                {
                  insert: ' ccc',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('inline link', async () => {
    const markdown = 'aaa https://affine.pro/ ccc\n';
    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
                  insert: 'aaa ',
                },
                {
                  insert: 'https://affine.pro/',
                  attributes: {
                    link: 'https://affine.pro/',
                  },
                },
                {
                  insert: ' ccc',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('bold', async () => {
    const markdown = 'aaa**bbb**ccc\n';

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
                {
                  insert: 'bbb',
                  attributes: {
                    bold: true,
                  },
                },
                {
                  insert: 'ccc',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('italic', async () => {
    const markdown = 'aaa*bbb*ccc\n';

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
                {
                  insert: 'bbb',
                  attributes: {
                    italic: true,
                  },
                },
                {
                  insert: 'ccc',
                },
              ],
            },
          },
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
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
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
                  titleColumn: 'matchesReplaceMap[9]',
                  iconColumn: 'type',
                },
              },
            ],
            title: {
              '$blocksuite:internal:text$': true,
              delta: [],
            },
            cells: {
              'matchesReplaceMap[12]': {
                'matchesReplaceMap[10]': {
                  columnId: 'matchesReplaceMap[10]',
                  value: 'eee',
                },
                'matchesReplaceMap[11]': {
                  columnId: 'matchesReplaceMap[11]',
                  value: 'fff',
                },
              },
            },
            columns: [
              {
                type: 'title',
                name: 'aaa',
                data: {},
                id: 'matchesReplaceMap[9]',
              },
              {
                type: 'rich-text',
                name: 'bbb',
                data: {},
                id: 'matchesReplaceMap[10]',
              },
              {
                type: 'rich-text',
                name: 'ccc',
                data: {},
                id: 'matchesReplaceMap[11]',
              },
            ],
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[12]',
              flavour: 'affine:paragraph',
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
              children: [],
            },
          ],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('html tag', async () => {
    const markdown = `<aaa>\n`;

    const blockSnapshot: BlockSnapshot = {
      type: 'block',
      id: 'matchesReplaceMap[0]',
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
          children: [],
        },
      ],
    };

    const mdAdapter = new MarkdownAdapter();
    const rawBlockSnapshot = await mdAdapter.toBlockSnapshot({
      file: markdown,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
