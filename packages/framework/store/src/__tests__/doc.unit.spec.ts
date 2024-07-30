import { expect, test, vi } from 'vitest';
import * as Y from 'yjs';

import { Schema } from '../schema/index.js';
import {
  BlockViewType,
  DocCollection,
  IdGeneratorType,
} from '../store/index.js';
import {
  DividerBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  type RootBlockModel,
  RootBlockSchema,
} from './test-schema.js';

const BlockSchemas = [
  RootBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  DividerBlockSchema,
];

function createTestOptions() {
  const idGenerator = IdGeneratorType.AutoIncrement;
  const schema = new Schema();
  schema.register(BlockSchemas);
  return { id: 'test-collection', idGenerator, schema };
}

test('trigger props updated', () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();

  const doc = collection.createDoc({ id: 'home' });
  doc.load();

  doc.addBlock('affine:page');

  const rootModel = doc.root as RootBlockModel;

  expect(rootModel).not.toBeNull();

  const onPropsUpdated = vi.fn();
  rootModel.propsUpdated.on(onPropsUpdated);

  const getColor = () =>
    (rootModel.yBlock.get('prop:style') as Y.Map<string>).get('color');

  const getItems = () => rootModel.yBlock.get('prop:items') as Y.Array<unknown>;
  const getCount = () => rootModel.yBlock.get('prop:count');

  rootModel.count = 1;
  expect(onPropsUpdated).toBeCalledTimes(1);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(1, { key: 'count' });
  expect(getCount()).toBe(1);

  rootModel.count = 2;
  expect(onPropsUpdated).toBeCalledTimes(2);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(2, { key: 'count' });
  expect(getCount()).toBe(2);

  rootModel.style.color = 'blue';
  expect(onPropsUpdated).toBeCalledTimes(3);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(3, { key: 'style' });
  expect(getColor()).toBe('blue');

  rootModel.style = { color: 'red' };
  expect(onPropsUpdated).toBeCalledTimes(4);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(4, { key: 'style' });
  expect(getColor()).toBe('red');

  rootModel.style.color = 'green';
  expect(onPropsUpdated).toBeCalledTimes(5);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(5, { key: 'style' });
  expect(getColor()).toBe('green');

  rootModel.items.push(1);
  expect(onPropsUpdated).toBeCalledTimes(6);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(6, { key: 'items' });
  expect(getItems().get(0)).toBe(1);

  rootModel.items[0] = { id: '1' };
  expect(onPropsUpdated).toBeCalledTimes(7);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(7, { key: 'items' });
  expect(getItems().get(0)).toBeInstanceOf(Y.Map);
  expect((getItems().get(0) as Y.Map<unknown>).get('id')).toBe('1');
});

test('stash and pop', () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();

  const doc = collection.createDoc({ id: 'home' });
  doc.load();

  doc.addBlock('affine:page');

  const rootModel = doc.root as RootBlockModel;

  expect(rootModel).not.toBeNull();

  const onPropsUpdated = vi.fn();
  rootModel.propsUpdated.on(onPropsUpdated);

  const getCount = () => rootModel.yBlock.get('prop:count');
  const getColor = () =>
    (rootModel.yBlock.get('prop:style') as Y.Map<string>).get('color');

  rootModel.count = 1;
  expect(onPropsUpdated).toBeCalledTimes(1);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(1, { key: 'count' });
  expect(getCount()).toBe(1);

  rootModel.stash('count');
  rootModel.count = 2;
  expect(onPropsUpdated).toBeCalledTimes(3);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(3, { key: 'count' });
  expect(rootModel.yBlock.get('prop:count')).toBe(1);

  rootModel.pop('count');
  expect(onPropsUpdated).toBeCalledTimes(4);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(4, { key: 'count' });
  expect(rootModel.yBlock.get('prop:count')).toBe(2);

  rootModel.style.color = 'blue';
  expect(getColor()).toBe('blue');
  expect(onPropsUpdated).toBeCalledTimes(5);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(5, { key: 'style' });

  rootModel.stash('style');
  rootModel.style = {
    color: 'red',
  };
  expect(getColor()).toBe('blue');
  expect(onPropsUpdated).toBeCalledTimes(7);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(7, { key: 'style' });

  rootModel.pop('style');
  expect(getColor()).toBe('red');
  expect(onPropsUpdated).toBeCalledTimes(8);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(8, { key: 'style' });

  rootModel.stash('style');
  expect(onPropsUpdated).toBeCalledTimes(9);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(9, { key: 'style' });

  rootModel.style.color = 'green';
  expect(onPropsUpdated).toBeCalledTimes(10);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(10, { key: 'style' });
  expect(getColor()).toBe('red');

  rootModel.pop('style');
  expect(getColor()).toBe('green');
  expect(onPropsUpdated).toBeCalledTimes(11);
  expect(onPropsUpdated).toHaveBeenNthCalledWith(11, { key: 'style' });
});

test('always get latest value in onChange', () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();

  const doc = collection.createDoc({ id: 'home' });
  doc.load();

  doc.addBlock('affine:page');

  const rootModel = doc.root as RootBlockModel;

  expect(rootModel).not.toBeNull();

  let value: unknown;
  rootModel.propsUpdated.on(({ key }) => {
    // @ts-ignore
    value = rootModel[key];
  });

  rootModel.count = 1;
  expect(value).toBe(1);

  rootModel.stash('count');

  rootModel.count = 2;
  expect(value).toBe(2);

  rootModel.pop('count');

  rootModel.count = 3;
  expect(value).toBe(3);

  rootModel.style.color = 'blue';
  expect(value).toEqual({ color: 'blue' });

  rootModel.stash('style');
  rootModel.style = { color: 'red' };
  expect(value).toEqual({ color: 'red' });
  rootModel.style.color = 'green';
  expect(value).toEqual({ color: 'green' });

  rootModel.pop('style');
  rootModel.style.color = 'yellow';
  expect(value).toEqual({ color: 'yellow' });
});

test('query', () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc1 = collection.createDoc({ id: 'home' });
  doc1.load();
  const doc2 = collection.getDoc('home');

  const doc3 = collection.getDoc('home', {
    query: {
      mode: 'loose',
      match: [
        {
          flavour: 'affine:list',
          viewType: BlockViewType.Hidden,
        },
      ],
    },
  });
  expect(doc1).toBe(doc2);
  expect(doc1).not.toBe(doc3);

  const page = doc1.addBlock('affine:page');
  const note = doc1.addBlock('affine:note', {}, page);
  const paragraph1 = doc1.addBlock('affine:paragraph', {}, note);
  const list1 = doc1.addBlock('affine:list' as never, {}, note);

  expect(doc2?.getBlock(paragraph1)?.blockViewType).toBe(BlockViewType.Display);
  expect(doc2?.getBlock(list1)?.blockViewType).toBe(BlockViewType.Display);
  expect(doc3?.getBlock(list1)?.blockViewType).toBe(BlockViewType.Hidden);

  const list2 = doc1.addBlock('affine:list' as never, {}, note);

  expect(doc2?.getBlock(list2)?.blockViewType).toBe(BlockViewType.Display);
  expect(doc3?.getBlock(list2)?.blockViewType).toBe(BlockViewType.Hidden);
});

test('local readonly', () => {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc1 = collection.createDoc({ id: 'home' });
  doc1.load();
  const doc2 = collection.getDoc('home', { readonly: true });
  const doc3 = collection.getDoc('home', { readonly: false });

  expect(doc1.readonly).toBeFalsy();
  expect(doc2?.readonly).toBeTruthy();
  expect(doc3?.readonly).toBeFalsy();

  collection.awarenessStore.setReadonly(doc1.blockCollection, true);

  expect(doc1.readonly).toBeTruthy();
  expect(doc2?.readonly).toBeTruthy();
  expect(doc3?.readonly).toBeTruthy();

  collection.awarenessStore.setReadonly(doc1.blockCollection, false);

  expect(doc1.readonly).toBeFalsy();
  expect(doc2?.readonly).toBeTruthy();
  expect(doc3?.readonly).toBeFalsy();
});
