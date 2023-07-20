type SelectionConstructor<T = unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
  type: string;
};

export abstract class BaseSelection {
  static readonly type: string;
  readonly blockId: string;
  constructor(blockId: string) {
    this.blockId = blockId;
  }

  is<T extends BaseSelection>(
    selection: SelectionConstructor<T>['type']
  ): this is T {
    return (this.constructor as SelectionConstructor).type === selection;
  }

  abstract equals(other: BaseSelection): boolean;

  abstract toJSON(): Record<string, unknown>;

  static fromJSON(_: Record<string, unknown>): BaseSelection {
    throw new Error('You must override this method');
  }
}
