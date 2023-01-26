import type { Page } from '@blocksuite/store';
import { BaseBlockModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';
type TagSchema = BlockSuiteInternal.TagSchema;

export enum DatabaseBlockDisplayMode {
  Text,
  Grid,
  Database,
}

export class DatabaseBlockModel extends BaseBlockModel {
  static version = 1;
  flavour = 'affine:database' as const;
  tag = literal`affine-database`;
  title: string;
  /**
   * Tip: this is a yArray proxy from upstream
   */
  columns: TagSchema['id'][];
  mode: DatabaseBlockDisplayMode;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.DatabaseBlockModel>>
  ) {
    super(page, props);
    this.title = props.title ?? '';
    this.columns = props.columns ?? [];
    this.mode = DatabaseBlockDisplayMode.Database;
  }
}
