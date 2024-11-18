import type { SurfaceBlockModel } from '@blocksuite/blocks';
import type { PointLocation } from '@blocksuite/global/utils';

import { beforeEach, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

const excludes = new Set([
  'shape-textBound',
  'externalXYWH',
  'connector-text',
  'connector-labelXYWH',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldChecker: Record<string, (value: any) => boolean> = {
  'connector-path': (value: PointLocation[]) => {
    return value.length > 0;
  },
  xywh: (value: string) => {
    return value.match(xywhPattern) !== null;
  },
};

const snapshotTest = async (snapshotUrl: string, elementsCount: number) => {
  const pageService = window.editor.host!.std.getService('affine:page');
  if (!pageService) {
    throw new Error('page service not found');
  }
  const transformer = pageService.transformers.zip;

  const snapshotFile = await fetch(snapshotUrl)
    .then(res => res.blob())
    .catch(e => {
      console.error(e);
      throw e;
    });
  const [newDoc] = await transformer.importDocs(
    window.editor.doc.collection,
    snapshotFile
  );

  if (!newDoc) {
    throw new Error('Failed to import snapshot');
  }

  editor.doc = newDoc;
  await wait();

  const surface = newDoc.getBlockByFlavour(
    'affine:surface'
  )[0] as SurfaceBlockModel;
  const surfaceElements = [...surface['_elementModels']].map(
    ([_, { model }]) => model
  );

  expect(surfaceElements.length).toBe(elementsCount);

  surfaceElements.forEach(element => {
    const type = element.type;

    for (const field in element) {
      const value = element[field as keyof typeof element];
      const typeField = `${type}-${field}`;

      if (excludes.has(`${type}-${field}`) || excludes.has(field)) {
        return;
      }

      if (fieldChecker[typeField] || fieldChecker[field]) {
        const checker = fieldChecker[typeField] || fieldChecker[field];
        expect(checker(value)).toBe(true);
      } else {
        expect(
          value,
          `type: ${element.type} field: "${field}"`
        ).not.toBeUndefined();
        expect(value, `type: ${element.type} field: "${field}"`).not.toBeNull();
        expect(value, `type: ${element.type} field: "${field}"`).not.toBeNaN();
      }
    }
  });
};

beforeEach(async () => {
  const cleanup = await setupEditor('page');

  return cleanup;
});

const xywhPattern = /\[(\s*-?\d+(\.\d+)?\s*,){3}(\s*-?\d+(\.\d+)?\s*)\]/;

test('snapshot 1 importing', async () => {
  await snapshotTest('https://test.affineassets.com/test-snapshot-1.zip', 25);
});

test('snapshot 2 importing', async () => {
  await snapshotTest(
    'https://test.affineassets.com/test-snapshot-2%20(onboarding).zip',
    174
  );
});
