import type { Root } from 'mdast';
import { expect, test } from 'vitest';

import { MarkdownAdapter } from '../../adapter/index';
import type { BlockSnapshot } from '../../transformer/type';

test('test markdown adapter', async () => {
  const blockSnapshot: BlockSnapshot = {
    type: 'block',
    id: 'block:qyONabScta',
    flavour: 'affine:page',
    props: {
      title: {
        '$blocksuite:internal:text$': true,
        delta: [
          {
            insert: 'Welcome to BlockSuite Playground',
          },
        ],
      },
    },
    children: [
      {
        type: 'block',
        id: 'block:zLV6iQZz5p',
        flavour: 'affine:note',
        props: {
          xywh: '[0,100,800,640]',
          background: '--affine-background-secondary-color',
          index: 'a0',
          hidden: false,
        },
        children: [
          {
            type: 'block',
            id: 'block:MXf8RFQRR0',
            flavour: 'affine:paragraph',
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'This playground is designed to:',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:-qLtUETJlQ',
            flavour: 'affine:list',
            props: {
              type: 'bulleted',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: '📝 Test basic editing experience.',
                  },
                ],
              },
              checked: false,
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:0cyF20fBJm',
            flavour: 'affine:list',
            props: {
              type: 'bulleted',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: '⚙️ Serve as E2E test entry.',
                  },
                ],
              },
              checked: false,
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:y-PfTvWS90',
            flavour: 'affine:list',
            props: {
              type: 'bulleted',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert:
                      '🔗 Demonstrate how BlockSuite reconciles real-time collaboration with ',
                  },
                  {
                    insert: 'local-first',
                    attributes: {
                      link: 'https://martin.kleppmann.com/papers/local-first.pdf',
                    },
                  },
                  {
                    insert: ' data ownership.',
                  },
                ],
              },
              checked: false,
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:JEsTuymTM9',
            flavour: 'affine:paragraph',
            props: {
              type: 'h2',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'Controlling Playground Data Source',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:klbAqz8xgr',
            flavour: 'affine:paragraph',
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'You might initially enter this page with the ',
                  },
                  {
                    insert: '?init',
                    attributes: {
                      code: true,
                    },
                  },
                  {
                    insert:
                      ' URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you\'ll connect to a random single-user room via a broadcast channel provider by default. This is the "single-user mode" for local testing.',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:UsJCB37SbI',
            flavour: 'affine:paragraph',
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert:
                      'To test real-time collaboration, you can specify the room to join by adding the ',
                  },
                  {
                    insert: '?room=foo',
                    attributes: {
                      code: true,
                    },
                  },
                  {
                    insert: ' config - Try opening this page with ',
                  },
                  {
                    insert: '?room=foo',
                    attributes: {
                      code: true,
                    },
                  },
                  {
                    insert: ' in two different tabs and see what happens!',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:Xbmnt_J8go',
            flavour: 'affine:paragraph',
            props: {
              type: 'quote',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert:
                      'Note that the second and subsequent users should not open the page with the ',
                  },
                  {
                    insert: '?init',
                    attributes: {
                      code: true,
                    },
                  },
                  {
                    insert: ' param in this case.',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:2IUvjFqUJA',
            flavour: 'affine:paragraph',
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert:
                      'If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the ',
                  },
                  {
                    insert: '?providers=idb&room=foo',
                    attributes: {
                      code: true,
                    },
                  },
                  {
                    insert:
                      ' config, then click the init button in the bottom-left corner to initialize this default content.',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:UDPn2lIF1R',
            flavour: 'affine:paragraph',
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert:
                      'As a pro tip, you can combine multiple providers! For example, feel free to open this page with ',
                  },
                  {
                    insert: '?providers=idb,bc&room=hello',
                    attributes: {
                      code: true,
                    },
                  },
                  {
                    insert:
                      ' params (IndexedDB + BroadcastChannel), and see if everything works as expected. Have fun!',
                  },
                ],
              },
            },
            children: [],
          },
          {
            type: 'block',
            id: 'block:_YTNdN8acX',
            flavour: 'affine:paragraph',
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'For any feedback, please visit ',
                  },
                  {
                    insert: 'BlockSuite issues',
                    attributes: {
                      link: 'https://github.com/toeverything/blocksuite/issues',
                    },
                  },
                  {
                    insert: ' 📍',
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

  const markdown = `This playground is designed to:

* 📝 Test basic editing experience.

* ⚙️ Serve as E2E test entry.

* 🔗 Demonstrate how BlockSuite reconciles real-time collaboration with [local-first](https://martin.kleppmann.com/papers/local-first.pdf) data ownership.

## Controlling Playground Data Source

You might initially enter this page with the ?init URL param. This is the default (opt-in) setup that automatically loads this built-in article. Meanwhile, you'll connect to a random single-user room via a broadcast channel provider by default. This is the "single-user mode" for local testing.

To test real-time collaboration, you can specify the room to join by adding the ?room=foo config - Try opening this page with ?room=foo in two different tabs and see what happens!

> Note that the second and subsequent users should not open the page with the ?init param in this case.

If you are the only user in the room, your content will be lost after refresh. This is great for local debugging. But if you want local persistence, you can open this page with the ?providers=idb\\&room=foo config, then click the init button in the bottom-left corner to initialize this default content.

As a pro tip, you can combine multiple providers! For example, feel free to open this page with ?providers=idb,bc\\&room=hello params (IndexedDB + BroadcastChannel), and see if everything works as expected. Have fun!

For any feedback, please visit [BlockSuite issues](https://github.com/toeverything/blocksuite/issues) 📍
`;
  const mdAdapter = new MarkdownAdapter();
  const root: Root = {
    type: 'root',
    children: [],
  };
  const ast = await mdAdapter.traverseSnapshot2(blockSnapshot, root);
  expect(mdAdapter.astToMardown(ast)).toBe(markdown);
});
