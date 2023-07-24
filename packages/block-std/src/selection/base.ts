type SelectionConstructor<T = unknown> = {
  new (...args: unknown[]): T;
  type: string;
};

export abstract class BaseSelection {
  static readonly type: string;
  readonly blockId: string;
  constructor(blockId: string) {
    this.blockId = blockId;
  }

  is<T extends BlockSuiteSelectionType>(
    type: T
  ): this is BlockSuiteSelectionInstance[T] {
    return this.type === type;
  }

  get type(): BlockSuiteSelectionType {
    return (this.constructor as SelectionConstructor)
      .type as BlockSuiteSelectionType;
  }

  abstract equals(other: BaseSelection): boolean;

  abstract toJSON(): Record<string, unknown>;

  static fromJSON(_: Record<string, unknown>): BaseSelection {
    throw new Error('You must override this method');
  }
}
