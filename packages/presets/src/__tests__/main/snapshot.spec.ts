import type { SurfaceBlockModel } from '@blocksuite/blocks';

import { beforeEach, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

const excludes = new Set([
  'shape-textBound',
  'externalXYWH',
  'connector-text',
  'connector-labelXYWH',
]);

beforeEach(async () => {
  const cleanup = await setupEditor('page');

  return cleanup;
});

const xywhPattern = /\[(\s*-?\d+(\.\d+)?\s*,){3}(\s*-?\d+(\.\d+)?\s*)\]/;

test('snapshot 1 importing', async () => {
  const pageService = window.editor.host!.std.getService('affine:page');
  if (!pageService) {
    throw new Error('page service not found');
  }
  const transformer = pageService.transformers.zip;

  const snapshotFile = await fetch(
    'https://test.affineassets.com/test-snapshot-1.zip'
  )
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

  expect(surfaceElements.length).toBe(25);

  surfaceElements.forEach(element => {
    type Type = keyof typeof element;
    for (const field in element) {
      const value = element[field as Type];

      if (excludes.has(`${element.type}-${field}`) || excludes.has(field)) {
        return;
      }

      if (field === 'xywh') {
        expect(value).toMatch(xywhPattern);
      }

      expect(
        value,
        `type: ${element.type} field: "${field}"`
      ).not.toBeUndefined();
      expect(value, `type: ${element.type} field: "${field}"`).not.toBeNull();
      expect(value, `type: ${element.type} field: "${field}"`).not.toBeNaN();
    }
  });
});

test('snapshot 2 importing', async () => {
  const pageService = window.editor.host!.std.getService('affine:page');
  if (!pageService) {
    throw new Error('page service not found');
  }
  const transformer = pageService.transformers.zip;

  const snapshotFile = await fetch(
    'https://test.affineassets.com/test-snapshot-2%20(onboarding).zip'
  )
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

  expect(surfaceElements.length).toBe(174);

  surfaceElements.forEach(element => {
    for (const field in element) {
      const value = element[field as keyof typeof element];

      if (excludes.has(`${element.type}-${field}`) || excludes.has(field)) {
        return;
      }

      if (field === 'xywh') {
        expect(value).toMatch(xywhPattern);
      }

      expect(
        value,
        `type: ${element.type} field: "${field}"`
      ).not.toBeUndefined();
      expect(value, `type: ${element.type} field: "${field}"`).not.toBeNull();
      expect(value, `type: ${element.type} field: "${field}"`).not.toBeNaN();
    }
  });
});
