import { BaseBlockModel, Page } from '@blocksuite/store';
import TagType = BlockSuiteInternal.TagType;
import TagTypes = BlockSuiteInternal.TagTypes;

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

  addColumn(tagType: TagTypes) {
    // todo
  }

  deleteColumn() {
    // todo
  }
}
