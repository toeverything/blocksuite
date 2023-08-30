import { BaseSelection } from '@blocksuite/block-std';

import type {
  DataViewSelection,
  GetDataViewSelection,
} from '../../__internal__/index.js';

export class DatabaseSelection extends BaseSelection {
  static override type = 'database';
  static override group = 'note';

  readonly viewSelection: DataViewSelection;

  constructor({
    path,
    viewSelection,
  }: {
    path: string[];
    viewSelection: DataViewSelection;
  }) {
    super({
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
      viewSelection: this.viewSelection,
    };
  }

  static override fromJSON(json: Record<string, unknown>): DatabaseSelection {
    return new DatabaseSelection({
      path: json.path as string[],
      viewSelection: json.viewSelection as DataViewSelection,
    });
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace BlockSuite {
    interface Selection {
      database: typeof DatabaseSelection;
    }
  }
}
