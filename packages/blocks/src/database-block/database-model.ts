import { BaseBlockModel, Page } from '@blocksuite/store';
import TagType = BlockSuiteInternal.TagType;
import { literal } from 'lit/static-html.js';

export enum DatabaseBlockDisplayMode {
  Text,
  Grid,
  Database,
}

export class DatabaseBlockModel extends BaseBlockModel {
  flavour = 'affine:database' as const;
  tag = literal`affine-database`;
  /**
   * Tip: this is a yArray proxy from upstream
   */
  columns: TagType[];
  mode: DatabaseBlockDisplayMode;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.DatabaseBlockModel>>
  ) {
    super(page, props);
    this.columns = props.columns ?? [];
    this.mode = DatabaseBlockDisplayMode.Text;
  }
}
