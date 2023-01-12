import { BaseBlockModel, Page } from '@blocksuite/store';
import TagType = BlockSuiteInternal.TagType;

export enum DatabaseBlockDisplayMode {
  Text,
  Grid,
  Database,
}

export class DatabaseBlockModel extends BaseBlockModel {
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
