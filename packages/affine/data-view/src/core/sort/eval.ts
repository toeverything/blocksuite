import type { VariableOrProperty } from '../expression/types.js';
import type { SingleView } from '../view-manager/index.js';
import type { Sort } from './types.js';

import {
  isTArray,
  type TArray,
  tBoolean,
  tDate,
  tNumber,
  tRichText,
  tString,
  tTag,
  type TType,
  tUnknown,
  type TypeOfData,
  typesystem,
} from '../logical/index.js';
import { propertyMatcher } from '../logical/property-matcher.js';

const evalRef = (
  view: SingleView,
  ref: VariableOrProperty
):
  | ((row: string) => {
      value: unknown;
      ttype?: TType;
    })
  | undefined => {
  if (ref.type === 'ref') {
    const ttype = view.propertyDataTypeGet(ref.name);
    return row => ({
      value: view.cellValueGet(row, ref.name),
      ttype,
    });
  }
  const getValue = evalRef(view, ref.ref);
  const result = propertyMatcher.find(
    v => v.data.name === ref.propertyFuncName
  );

  try {
    return row => ({
      value: result?.data.impl(getValue?.(row)?.value),
      ttype: result?.type?.rt,
    });
  } catch (e) {
    console.error(e);
    return;
  }
};
const compareList = <T>(a: T[], b: T[], compare: (a: T, b: T) => number) => {
  let i = 0;
  while (i < a.length && i < b.length) {
    const result = compare(a[i], b[i]);
    if (result !== 0) {
      return result;
    }
    i++;
  }
  return 0;
};
const compareString = (a: unknown, b: unknown) => {
  if (typeof a != 'string') {
    return -1;
  }
  if (typeof b != 'string') {
    return 1;
  }
  const listA = a.split('.');
  const listB = b.split('.');
  return compareList(listA, listB, (a, b) => {
    const lowA = a.toLowerCase();
    const lowB = b.toLowerCase();
    const numberA = Number.parseInt(lowA);
    const numberB = Number.parseInt(lowB);
    if (
      !Number.isNaN(numberA) &&
      !Number.isNaN(numberB) &&
      numberA !== numberB
    ) {
      return numberA - numberB;
    }
    if (Number.isNaN(numberA)) {
      return -1;
    }
    if (Number.isNaN(numberB)) {
      return 1;
    }
    return lowA.localeCompare(lowB);
  });
};
const compareNumber = (a: unknown, b: unknown) => {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }
  return Number(a) - Number(b);
};
const compareBoolean = (a: unknown, b: unknown) => {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }
  const bA = a ? 1 : 0;
  const bB = b ? 1 : 0;
  return bA - bB;
};
const compareArray = (type: TArray, a: unknown, b: unknown) => {
  if (!Array.isArray(a)) {
    return -1;
  }
  if (!Array.isArray(b)) {
    return 1;
  }
  return compareList(a, b, (a, b) => {
    return compare(type.ele, a, b);
  });
};
const compareAny = (a: unknown, b: unknown) => {
  if (!a) {
    return -1;
  }
  if (!b) {
    return 1;
  }
  // @ts-ignore
  return a - b;
};

const compareTag = (type: TypeOfData<typeof tTag>, a: unknown, b: unknown) => {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }
  const indexA = type.data?.tags?.findIndex(tag => tag.id === a);
  const indexB = type.data?.tags?.findIndex(tag => tag.id === b);
  return compareNumber(indexA, indexB);
};

const compare = (type: TType, a: unknown, b: unknown): number => {
  if (typesystem.isSubtype(tString.create(), type)) {
    return compareString(a, b);
  }
  if (typesystem.isSubtype(tRichText.create(), type)) {
    return compareString(a?.toString(), b?.toString());
  }
  if (typesystem.isSubtype(tNumber.create(), type)) {
    return compareNumber(a, b);
  }
  if (typesystem.isSubtype(tDate.create(), type)) {
    return compareNumber(a, b);
  }
  if (typesystem.isSubtype(tBoolean.create(), type)) {
    return compareBoolean(a, b);
  }
  if (typesystem.isSubtype(tTag.create(), type)) {
    return compareTag(type as TypeOfData<typeof tTag>, a, b);
  }
  if (isTArray(type)) {
    return compareArray(type, a, b);
  }
  return compareAny(a, b);
};

export const evalSort = (
  sort: Sort,
  view: SingleView
): ((rowA: string, rowB: string) => number) | undefined => {
  if (sort.sortBy.length) {
    const sortBy = sort.sortBy.map(sort => {
      return {
        ref: evalRef(view, sort.ref),
        desc: sort.desc,
      };
    });
    return (rowA, rowB) => {
      for (const sort of sortBy) {
        const refA = sort.ref?.(rowA);
        const refB = sort.ref?.(rowB);
        const result = compare(
          refA?.ttype ?? tUnknown.create(),
          refA?.value,
          refB?.value
        );
        if (result !== 0) {
          return sort.desc ? -result : result;
        }
      }
      return 0;
    };
  }
  return;
};
