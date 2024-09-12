import type { TType } from './typesystem.js';

import { typesystem } from './typesystem.js';

type MatcherData<Data, Type extends TType = TType> = {
  type: Type;
  data: Data;
};

export class MatcherCreator<Data, Type extends TType = TType> {
  createMatcher(type: Type, data: Data) {
    return { type, data };
  }
}

export class Matcher<Data, Type extends TType = TType> {
  constructor(
    private list: MatcherData<Data, Type>[],
    private _match: (
      type: Type,
      target: TType
    ) => boolean = typesystem.isSubtype.bind(typesystem)
  ) {}

  all(): MatcherData<Data, Type>[] {
    return this.list;
  }

  allMatched(type: TType): MatcherData<Data>[] {
    const result: MatcherData<Data>[] = [];
    for (const t of this.list) {
      if (this._match(t.type, type)) {
        result.push(t);
      }
    }
    return result;
  }

  allMatchedData(type: TType): Data[] {
    const result: Data[] = [];
    for (const t of this.list) {
      if (this._match(t.type, type)) {
        result.push(t.data);
      }
    }
    return result;
  }

  find(
    f: (data: MatcherData<Data, Type>) => boolean
  ): MatcherData<Data, Type> | undefined {
    return this.list.find(f);
  }

  findData(f: (data: Data) => boolean): Data | undefined {
    return this.list.find(data => f(data.data))?.data;
  }

  isMatched(type: Type, target: TType) {
    return this._match(type, target);
  }

  match(type: TType) {
    for (const t of this.list) {
      if (this._match(t.type, type)) {
        return t.data;
      }
    }
    return;
  }
}
