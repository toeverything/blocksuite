import { describe, expect, test } from 'vitest';

import { MarkdownAdapter } from '../../adapter/index';
import type { BlockSnapshot } from '../../transformer/type';

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
    expect(target).toBe(markdown);
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
    expect(target).toBe(markdown);
  });

  test('list', async () => {
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

  - ddd

- eee
`;

    const mdAdapter = new MarkdownAdapter();
    const target = await mdAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target).toBe(markdown);
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
    expect(target).toBe(markdown);
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
    expect(target).toBe(markdown);
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
    expect(target).toBe(markdown);
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
    expect(target).toBe(markdown);
  });
});

describe('markdown to snapshot', () => {
  test('code', async () => {
    const markdown = '```python\nimport this\n```\n';

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

  test('list', async () => {
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

  test('bold', async () => {
    const markdown = 'aaa**bbb**ccc\n';

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
                columns: [
                  {
                    id: 'matchesReplaceMap[12]',
                    hide: false,
                    width: 180,
                  },
                  {
                    id: 'matchesReplaceMap[13]',
                    hide: false,
                    width: 180,
                  },
                  {
                    id: 'matchesReplaceMap[14]',
                    hide: false,
                    width: 180,
                  },
                ],
                filter: {
                  type: 'group',
                  op: 'and',
                  conditions: [],
                },
                header: {
                  titleColumn: 'matchesReplaceMap[12]',
                  iconColumn: 'type',
                },
              },
            ],
            title: {
              '$blocksuite:internal:text$': true,
              delta: [],
            },
            cells: {
              'matchesReplaceMap[15]': {
                'matchesReplaceMap[13]': {
                  columnId: 'matchesReplaceMap[13]',
                  value: 'eee',
                },
                'matchesReplaceMap[14]': {
                  columnId: 'matchesReplaceMap[14]',
                  value: 'fff',
                },
              },
            },
            columns: [
              {
                type: 'title',
                name: 'aaa',
                data: {},
                id: 'matchesReplaceMap[12]',
              },
              {
                type: 'rich-text',
                name: 'bbb',
                data: {},
                id: 'matchesReplaceMap[13]',
              },
              {
                type: 'rich-text',
                name: 'ccc',
                data: {},
                id: 'matchesReplaceMap[14]',
              },
            ],
          },
          children: [
            {
              type: 'block',
              id: 'matchesReplaceMap[15]',
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
});

function nanoidReplacement(snapshot: BlockSnapshot) {
  return JSON.parse(nanoidReplacementString(JSON.stringify(snapshot)));
}

function nanoidReplacementString(snapshotString: string) {
  const matches = snapshotString.matchAll(/"block:[A-Za-z0-9-_]{10}"/g);
  const matchesReplaceMap = new Map();
  Array.from(matches).map((match, index) =>
    matchesReplaceMap.set(match[0], `"matchesReplaceMap[${index}]"`)
  );
  return snapshotString.replace(/"block:[A-Za-z0-9-_]{10}"/g, match =>
    matchesReplaceMap.get(match)
  );
}
