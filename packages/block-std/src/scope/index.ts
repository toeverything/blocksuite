// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export class Scope {
  create(): AnyRecord {
    return {};
  }

  derive(scope: AnyRecord) {
    return {
      ...scope,
    };
  }
}
