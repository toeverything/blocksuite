type SelectionConstructor<T = unknown> = {
  type: string;
  group: string;
  new (...args: unknown[]): T;
};

export type BaseSelectionOptions = {
  blockId: string;
};

export abstract class BaseSelection {
  static readonly group: string;

  static readonly type: string;

  readonly blockId: string;

  constructor({ blockId }: BaseSelectionOptions) {
    this.blockId = blockId;
  }

  static fromJSON(_: Record<string, unknown>): BaseSelection {
    throw new Error('You must override this method');
  }

  is<T extends BlockSuite.SelectionType>(
    type: T
  ): this is BlockSuite.SelectionInstance[T] {
    return this.type === type;
  }

  get group(): string {
    return (this.constructor as SelectionConstructor).group;
  }

  get type(): BlockSuite.SelectionType {
    return (this.constructor as SelectionConstructor)
      .type as BlockSuite.SelectionType;
  }

  abstract equals(other: BaseSelection): boolean;

  abstract toJSON(): Record<string, unknown>;
}
