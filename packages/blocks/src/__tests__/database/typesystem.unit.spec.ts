import { describe, expect, test } from 'vitest';

import {
  tArray,
  tFunction,
  tTypeRef,
  tTypeVar,
  tUnion,
  tUnknown,
  typesystem,
} from '../../database-block/data-view/logical/typesystem.js';

export const tString = typesystem.defineData<{ value: string }>({
  name: 'String',
  supers: [],
});
export const tBoolean = typesystem.defineData<{ value: boolean }>({
  name: 'Boolean',
  supers: [],
});
export const tDate = typesystem.defineData<{ value: number }>({
  name: 'Date',
  supers: [],
});
export const tURL = typesystem.defineData({
  name: 'URL',
  supers: [tString],
});
export const tEmail = typesystem.defineData({
  name: 'Email',
  supers: [tString],
});
export const tPhone = typesystem.defineData({
  name: 'Phone',
  supers: [tString],
});
type Tag = { color: string; id: string; value: string };
export const tTag = typesystem.defineData<{ tags: Tag[] }>({
  name: 'Tag',
  supers: [],
});

describe('subtyping', () => {
  test('all type is subtype of unknown', () => {
    expect(typesystem.isSubtype(tUnknown.create(), tBoolean.create())).toBe(
      true
    );
    expect(typesystem.isSubtype(tUnknown.create(), tString.create())).toBe(
      true
    );
    expect(
      typesystem.isSubtype(tUnknown.create(), tArray(tString.create()))
    ).toBe(true);
    expect(
      typesystem.isSubtype(
        tUnknown.create(),
        tUnion([tString.create(), tBoolean.create()])
      )
    ).toBe(true);
    expect(typesystem.isSubtype(tUnknown.create(), tTag.create())).toBe(true);
  });
  test('allow extends type', () => {
    expect(typesystem.isSubtype(tString.create(), tPhone.create())).toBe(true);
    expect(typesystem.isSubtype(tString.create(), tEmail.create())).toBe(true);
    expect(typesystem.isSubtype(tString.create(), tURL.create())).toBe(true);
  });
});
describe('function apply', () => {
  test('generic type function', () => {
    const fn = tFunction({
      args: [tTypeRef('A'), tTypeRef('A')],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('A', tUnknown.create())],
    });
    const instancedFn = typesystem.instance(
      {},
      [tBoolean.create()],
      tBoolean.create(),
      fn
    );
    expect(instancedFn.args[1]).toStrictEqual(tBoolean.create());
  });
  test('tags infer', () => {
    const fn = tFunction({
      args: [tTypeRef('A'), tArray(tTypeRef('A'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('A', tTag.create())],
    });
    const fnArray = tFunction({
      args: [tArray(tTypeRef('A')), tArray(tTypeRef('A'))],
      rt: tBoolean.create(),
      typeVars: [tTypeVar('A', tTag.create())],
    });
    const tags: Tag[] = [{ color: 'c', id: 'a', value: 'b' }];
    const instancedFn = typesystem.instance(
      {},
      [tTag.create({ tags })],
      tBoolean.create(),
      fn
    );
    const instancedFnArray = typesystem.instance(
      {},
      [tArray(tTag.create({ tags }))],
      tBoolean.create(),
      fnArray
    );
    expect(instancedFn.args[1]).toStrictEqual(tArray(tTag.create({ tags })));
    expect(instancedFnArray.args[1]).toStrictEqual(
      tArray(tTag.create({ tags }))
    );
  });
});
