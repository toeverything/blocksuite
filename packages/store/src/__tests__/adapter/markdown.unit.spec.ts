import type { Root } from 'mdast';
import { describe, expect, test } from 'vitest';

import { MarkdownAdapter } from '../../adapter/index';
import type { BlockSnapshot } from '../../transformer/type';

describe('markdown adapter', () => {
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
    const root: Root = {
      type: 'root',
      children: [],
    };
    const ast = await mdAdapter.traverseSnapshot2(blockSnapshot, root);
    expect(mdAdapter.astToMardown(ast)).toBe(markdown);
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
    const root: Root = {
      type: 'root',
      children: [],
    };
    const ast = await mdAdapter.traverseSnapshot2(blockSnapshot, root);
    expect(mdAdapter.astToMardown(ast)).toBe(markdown);
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
    const root: Root = {
      type: 'root',
      children: [],
    };
    const ast = await mdAdapter.traverseSnapshot2(blockSnapshot, root);
    expect(mdAdapter.astToMardown(ast)).toBe(markdown);
  });
});
