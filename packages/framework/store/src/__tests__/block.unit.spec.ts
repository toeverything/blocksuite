import { computed, effect } from '@preact/signals-core';
import { describe, expect, test, vi } from 'vitest';
import * as Y from 'yjs';

import {
  defineBlockSchema,
  internalPrimitives,
  Schema,
  type SchemaToModel,
} from '../schema/index.js';
import { Block, type YBlock } from '../store/doc/block/index.js';
import { DocCollection, IdGeneratorType } from '../store/index.js';

const pageSchema = defineBlockSchema({
  flavour: 'page',
  props: internal => ({
    title: internal.Text(),
    count: 0,
    toggle: false,
    style: {} as Record<string, unknown>,
    boxed: internal.Boxed(new Y.Map()),
  }),
  metadata: {
    role: 'root',
    version: 1,
  },
});
type RootModel = SchemaToModel<typeof pageSchema>;

function createTestOptions() {
  const idGenerator = IdGeneratorType.AutoIncrement;
  const schema = new Schema();
  schema.register([pageSchema]);
  return { id: 'test-collection', idGenerator, schema };
}

const defaultDocId = 'doc:home';
function createTestDoc(docId = defaultDocId) {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc = collection.createDoc({ id: docId });
  doc.load();
  return doc;
}

test('init block without props should add default props', () => {
  const doc = createTestDoc();
  const yDoc = new Y.Doc();
  const yBlock = yDoc.getMap('yBlock') as YBlock;
  yBlock.set('sys:id', '0');
  yBlock.set('sys:flavour', 'page');
  yBlock.set('sys:children', new Y.Array());

  const block = new Block(doc.schema, yBlock, doc);
  const model = block.model as RootModel;

  expect(yBlock.get('prop:count')).toBe(0);
  expect(model.count).toBe(0);
  expect(model.style).toEqual({});
});

describe('block model should has signal props', () => {
  test('atom', () => {
    const doc = createTestDoc();
    const yDoc = new Y.Doc();
    const yBlock = yDoc.getMap('yBlock') as YBlock;
    yBlock.set('sys:id', '0');
    yBlock.set('sys:flavour', 'page');
    yBlock.set('sys:children', new Y.Array());

    const block = new Block(doc.schema, yBlock, doc);
    const model = block.model as RootModel;

    const isOdd = computed(() => model.count$.value % 2 === 1);

    expect(model.count$.value).toBe(0);
    expect(isOdd.peek()).toBe(false);

    // set prop
    model.count = 1;
    expect(model.count$.value).toBe(1);
    expect(isOdd.peek()).toBe(true);
    expect(yBlock.get('prop:count')).toBe(1);

    // set signal
    model.count$.value = 2;
    expect(model.count).toBe(2);
    expect(isOdd.peek()).toBe(false);
    expect(yBlock.get('prop:count')).toBe(2);

    // set prop
    yBlock.set('prop:count', 3);
    expect(model.count).toBe(3);
    expect(model.count$.value).toBe(3);
    expect(isOdd.peek()).toBe(true);

    const toggleEffect = vi.fn();
    effect(() => {
      toggleEffect(model.toggle$.value);
    });
    expect(toggleEffect).toHaveBeenCalledTimes(1);
    const runToggle = () => {
      const next = !model.toggle;
      model.toggle = next;
      expect(model.toggle$.value).toBe(next);
    };
    const times = 10;
    for (let i = 0; i < times; i++) {
      runToggle();
    }
    expect(toggleEffect).toHaveBeenCalledTimes(times + 1);
    const runToggleReverse = () => {
      const next = !model.toggle;
      model.toggle$.value = next;
      expect(model.toggle).toBe(next);
    };
    for (let i = 0; i < times; i++) {
      runToggleReverse();
    }
    expect(toggleEffect).toHaveBeenCalledTimes(times * 2 + 1);
  });

  test('nested', () => {
    const doc = createTestDoc();
    const yDoc = new Y.Doc();
    const yBlock = yDoc.getMap('yBlock') as YBlock;
    yBlock.set('sys:id', '0');
    yBlock.set('sys:flavour', 'page');
    yBlock.set('sys:children', new Y.Array());

    const block = new Block(doc.schema, yBlock, doc);
    const model = block.model as RootModel;
    expect(model.style).toEqual({});

    model.style = { color: 'red' };
    expect((yBlock.get('prop:style') as Y.Map<unknown>).toJSON()).toEqual({
      color: 'red',
    });
    expect(model.style$.value).toEqual({ color: 'red' });

    model.style.color = 'yellow';
    expect((yBlock.get('prop:style') as Y.Map<unknown>).toJSON()).toEqual({
      color: 'yellow',
    });
    expect(model.style$.value).toEqual({ color: 'yellow' });

    model.style$.value = { color: 'blue' };
    expect(model.style.color).toBe('blue');
    expect((yBlock.get('prop:style') as Y.Map<unknown>).toJSON()).toEqual({
      color: 'blue',
    });

    const map = new Y.Map();
    map.set('color', 'green');
    yBlock.set('prop:style', map);
    expect(model.style.color).toBe('green');
    expect(model.style$.value).toEqual({ color: 'green' });
  });

  test('with stash and pop', () => {
    const doc = createTestDoc();
    const yDoc = new Y.Doc();
    const yBlock = yDoc.getMap('yBlock') as YBlock;
    yBlock.set('sys:id', '0');
    yBlock.set('sys:flavour', 'page');
    yBlock.set('sys:children', new Y.Array());

    const block = new Block(doc.schema, yBlock, doc);
    const model = block.model as RootModel;

    expect(model.count).toBe(0);
    model.stash('count');

    model.count = 1;
    expect(model.count$.value).toBe(1);
    expect(yBlock.get('prop:count')).toBe(0);

    model.count$.value = 2;
    expect(model.count).toBe(2);
    expect(yBlock.get('prop:count')).toBe(0);

    model.pop('count');
    expect(yBlock.get('prop:count')).toBe(2);
    expect(model.count).toBe(2);
    expect(model.count$.value).toBe(2);

    model.stash('count');
    yBlock.set('prop:count', 3);
    expect(model.count).toBe(3);
    expect(model.count$.value).toBe(3);

    model.count$.value = 4;
    expect(yBlock.get('prop:count')).toBe(3);
    expect(model.count).toBe(4);

    model.pop('count');
    expect(yBlock.get('prop:count')).toBe(4);
  });
});

test('on change', () => {
  const doc = createTestDoc();
  const yDoc = new Y.Doc();
  const yBlock = yDoc.getMap('yBlock') as YBlock;
  yBlock.set('sys:id', '0');
  yBlock.set('sys:flavour', 'page');
  yBlock.set('sys:children', new Y.Array());

  const onPropsUpdated = vi.fn();
  const block = new Block(doc.schema, yBlock, doc, {
    onChange: onPropsUpdated,
  });
  const model = block.model as RootModel;

  model.title = internalPrimitives.Text('abc');
  expect(onPropsUpdated).toHaveBeenCalledWith(
    expect.anything(),
    'title',
    expect.anything()
  );
  expect(model.title$.value.toDelta()).toEqual([{ insert: 'abc' }]);

  onPropsUpdated.mockClear();

  model.title.insert('d', 1);
  expect(onPropsUpdated).toHaveBeenCalledWith(
    expect.anything(),
    'title',
    expect.anything()
  );

  expect(model.title$.value.toDelta()).toEqual([{ insert: 'adbc' }]);

  onPropsUpdated.mockClear();

  model.boxed.getValue()!.set('foo', 0);
  expect(onPropsUpdated).toHaveBeenCalledWith(
    expect.anything(),
    'boxed',
    expect.anything()
  );
  expect(onPropsUpdated.mock.calls[0][2].toJSON().value).toMatchObject({
    foo: 0,
  });
  expect(model.boxed$.value.getValue()!.toJSON()).toEqual({
    foo: 0,
  });
});
