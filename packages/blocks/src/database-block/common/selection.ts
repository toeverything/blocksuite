import { BaseSelection } from '@blocksuite/block-std';

import type {
  DataViewSelection,
  GetDataViewSelection,
} from '../../__internal__/index.js';

export class DatabaseSelection extends BaseSelection {
  static override type = 'database';

  readonly viewSelection: DataViewSelection;

  constructor({
    path,
    blockId,
    viewSelection,
  }: {
    blockId: string;
    path: string[];
    viewSelection: DataViewSelection;
  }) {
    super({
      blockId,
      path,
    });

    this.viewSelection = viewSelection;
  }

  get viewId() {
    return this.viewSelection.viewId;
  }

  getSelection<T extends DataViewSelection['type']>(
    type: T
  ): GetDataViewSelection<T> | undefined {
    return this.viewSelection.type === type
      ? (this.viewSelection as GetDataViewSelection<T>)
      : undefined;
  }

  override equals(other: BaseSelection): boolean {
    if (!(other instanceof DatabaseSelection)) {
      return false;
    }
    return this.blockId === other.blockId;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'database',
      path: this.path,
      blockId: this.blockId,
      viewSelection: this.viewSelection,
    };
  }

  static override fromJSON(json: Record<string, unknown>): DatabaseSelection {
    return new DatabaseSelection({
      path: json.path as string[],
      blockId: json.blockId as string,
      viewSelection: json.viewSelection as DataViewSelection,
    });
  }
}

declare global {
  interface BlockSuiteSelection {
    database: typeof DatabaseSelection;
  }
}
