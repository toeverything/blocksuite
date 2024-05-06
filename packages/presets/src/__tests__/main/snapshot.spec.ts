import type { SurfaceBlockModel } from '@blocksuite/blocks';
import { beforeEach, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

const excludes = new Map([['shape-textBound', true]]);

beforeEach(async () => {
  const cleanup = await setupEditor('page');

  return cleanup;
});

const xywhPattern = /\[(\s*\d(\.\d)?\s*,){4}(\s*\d(\.\d)?\s*)\]/;

test('snapshot 1 importing', async () => {
  const pageService = window.editor.host.std.spec.getService('affine:page');
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
    for (const field in element) {
      const value = element[field as keyof typeof element];

      if (excludes.has(`${element.type}-${field}`)) {
        return;
      }

      if (field === 'xywh') {
        expect(value).toMatch(xywhPattern);
      }

      expect(value).not.toBeUndefined();
      expect(value).not.toBeNull();
      expect(value).not.toBeNaN();
    }
  });
});

test('snapshot 2 importing', async () => {
  const pageService = window.editor.host.std.spec.getService('affine:page');
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

      if (excludes.has(`${element.type}-${field}`)) {
        return;
      }

      if (field === 'xywh') {
        expect(value).toMatch(xywhPattern);
      }

      expect(value).not.toBeUndefined();
      expect(value).not.toBeNull();
      expect(value).not.toBeNaN();
    }
  });
});
