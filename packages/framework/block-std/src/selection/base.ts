import { PathFinder } from '../utils/index.js';

type SelectionConstructor<T = unknown> = {
  new (...args: unknown[]): T;
  type: string;
  group: string;
};

export type BaseSelectionOptions = {
  path: string[];
};

export abstract class BaseSelection {
  static readonly type: string;
  static readonly group: string;
  readonly path: string[];

  constructor({ path }: BaseSelectionOptions) {
    this.path = path;
  }

  get blockId(): string {
    return PathFinder.id(this.path);
  }

  is<T extends BlockSuite.SelectionType>(
    type: T
  ): this is BlockSuite.SelectionInstance[T] {
    return this.type === type;
  }

  get type(): BlockSuite.SelectionType {
    return (this.constructor as SelectionConstructor)
      .type as BlockSuite.SelectionType;
  }

  get group(): string {
    return (this.constructor as SelectionConstructor).group;
  }

  abstract equals(other: BaseSelection): boolean;

  abstract toJSON(): Record<string, unknown>;

  static fromJSON(_: Record<string, unknown>): BaseSelection {
    throw new Error('You must override this method');
  }
}
