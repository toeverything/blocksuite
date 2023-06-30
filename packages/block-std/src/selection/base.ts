export abstract class BaseSelection {
  static readonly type: string;
  readonly blockId: string;
  constructor(blockId: string) {
    this.blockId = blockId;
  }

  abstract equals(other: BaseSelection): boolean;

  abstract toJSON(): Record<string, unknown>;

  static fromJSON(_: Record<string, unknown>): BaseSelection {
    throw new Error('You must override this method');
  }
}
