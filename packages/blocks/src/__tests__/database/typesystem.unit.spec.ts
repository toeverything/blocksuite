import { type SelectTag, t, typeSystem } from '@blocksuite/data-view';
import { describe, expect, test } from 'vitest';

describe('subtyping', () => {
  test('all type is subtype of unknown', () => {
    expect(typeSystem.unify(t.unknown.instance(), t.boolean.instance())).toBe(
      true
    );
    expect(typeSystem.unify(t.unknown.instance(), t.string.instance())).toBe(
      true
    );
    expect(
      typeSystem.unify(
        t.unknown.instance(),
        t.array.instance(t.string.instance())
      )
    ).toBe(true);
    expect(typeSystem.unify(t.unknown.instance(), t.tag.instance())).toBe(true);
  });
});
describe('function apply', () => {
  test('generic type function', () => {
    const fn = t.fn.instance(
      [t.typeVarReference.create('A'), t.typeVarReference.create('A')],
      t.boolean.instance(),
      [t.typeVarDefine.create('A', t.unknown.instance())]
    );
    const instancedFn = typeSystem.instanceFn(
      fn,
      [t.boolean.instance()],
      t.boolean.instance(),
      {}
    );
    expect(instancedFn?.args[1]).toStrictEqual(t.boolean.instance());
  });
  test('tags infer', () => {
    const fn = t.fn.instance(
      [
        t.typeVarReference.create('A'),
        t.array.instance(t.typeVarReference.create('A')),
      ] as const,
      t.boolean.instance(),
      [t.typeVarDefine.create('A', t.tag.instance())]
    );
    const fnArray = t.fn.instance(
      [
        t.array.instance(t.typeVarReference.create('A')),
        t.array.instance(t.typeVarReference.create('A')),
      ] as const,
      t.boolean.instance(),
      [t.typeVarDefine.create('A', t.tag.instance())]
    );
    const tags: SelectTag[] = [{ id: 'a', value: 'b', color: 'c' }];
    const instancedFn = typeSystem.instanceFn(
      fn,
      [t.tag.instance(tags)],
      t.boolean.instance(),
      {}
    );
    const instancedFnArray = typeSystem.instanceFn(
      fnArray,
      [t.array.instance(t.tag.instance(tags))],
      t.boolean.instance(),
      {}
    );
    expect(instancedFn?.args[1]).toStrictEqual(
      t.array.instance(t.tag.instance(tags))
    );
    expect(instancedFnArray?.args[1]).toStrictEqual(
      t.array.instance(t.tag.instance(tags))
    );
  });
});
