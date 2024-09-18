import type { SliceSnapshot } from '@blocksuite/store';

import { DEFAULT_NOTE_BACKGROUND_COLOR } from '@blocksuite/affine-model';
import { describe, expect, test } from 'vitest';

import { NotionTextAdapter } from '../../_common/adapters/notion-text.js';
import { nanoidReplacement } from '../../_common/test-utils/test-utils.js';
import { createJob } from '../utils/create-job.js';

describe('notion-text to snapshot', () => {
  test('basic', () => {
    const notionText =
      '{"blockType":"text","editing":[["aaa ",[["_"],["b"],["i"]]],["nbbbb ",[["_"],["i"]]],["hjhj ",[["_"]]],["a",[["_"],["c"]]],["  ",[["_"]]],["ccc d",[["_"],["s"]]],["dd",[["_"],["s"]]]]}';

    const sliceSnapshot: SliceSnapshot = {
      type: 'slice',
      content: [
        {
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
              flavour: 'affine:paragraph',
              props: {
                type: 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                      attributes: {
                        underline: true,
                        bold: true,
                        italic: true,
                      },
                    },
                    {
                      insert: 'nbbbb ',
                      attributes: {
                        underline: true,
                        italic: true,
                      },
                    },
                    {
                      insert: 'hjhj ',
                      attributes: {
                        underline: true,
                      },
                    },
                    {
                      insert: 'a',
                      attributes: {
                        underline: true,
                        code: true,
                      },
                    },
                    {
                      insert: '  ',
                      attributes: {
                        underline: true,
                      },
                    },
                    {
                      insert: 'ccc d',
                      attributes: {
                        underline: true,
                        strike: true,
                      },
                    },
                    {
                      insert: 'dd',
                      attributes: {
                        underline: true,
                        strike: true,
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
      pageVersion: 0,
      workspaceVersion: 0,
      workspaceId: '',
      pageId: '',
    };

    const ntAdapter = new NotionTextAdapter(createJob());
    const target = ntAdapter.toSliceSnapshot({
      file: notionText,
      pageVersion: 0,
      workspaceVersion: 0,
      workspaceId: '',
      pageId: '',
    });
    expect(nanoidReplacement(target!)).toEqual(sliceSnapshot);
  });
});
