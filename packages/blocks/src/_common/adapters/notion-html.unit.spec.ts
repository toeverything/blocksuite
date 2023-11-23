import type { BlockSnapshot } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { NotionHtmlAdapter } from './notion-html.js';
import { nanoidReplacement } from './utils.unit.spec.js';

describe('notion html to snapshot', () => {
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
    console.log(JSON.stringify(rawBlockSnapshot, null, 2));
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
