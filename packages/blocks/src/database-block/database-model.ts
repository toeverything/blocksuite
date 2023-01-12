import { BaseBlockModel, Page } from '@blocksuite/store';
import TagType = BlockSuiteInternal.TagType;

export class DatabaseModel extends BaseBlockModel {
  columns: TagType[];
  constructor(
    page: Page,
    props: PropsWithId<BlockSuiteModelProps.DatabaseBlockModel>
  ) {
    super(page, props);
    if (!props.columns) {
      throw new TypeError('must provide `props.columns`');
    }
    this.columns = props.columns;
  }
}
