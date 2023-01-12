import { BaseBlockModel, Page } from '@blocksuite/store';
import TagType = BlockSuiteInternal.TagType;

export class DatabaseModel extends BaseBlockModel {
  /**
   * Tip: this is a yArray proxy from upstream
   */
  columns: TagType[];
  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.DatabaseBlockModel>>
  ) {
    super(page, props);
    this.columns = props.columns ?? [];
  }
}
