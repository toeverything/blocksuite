import type { EditorHost } from '@blocksuite/lit';

import type { DatabaseBlockModel } from '../../database-model.js';
import { AllPageDatasource } from './all-page-datasource.js';
import type {
  AllPageDatasourceConfig,
  DatabaseBlockDatasourceConfig,
  DataSource,
  DataSourceConfig,
  GetConfig,
  TagsDatasourceConfig,
} from './base.js';
import { DatabaseBlockDatasource } from './database-block-datasource.js';
import { TagsDatasource } from './tags-datasource.js';

const datasourceMap: {
  [K in DataSourceConfig['type']]: {
    title: (root: EditorHost, config: GetConfig<K>) => string;
    constructor: new (root: EditorHost, config: GetConfig<K>) => DataSource;
  };
} = {
  'database-block': {
    title: (root: EditorHost, config: DatabaseBlockDatasourceConfig) => {
      const dbblock = root.page.workspace
        .getPage(config.pageId)
        ?.getBlockById(config.blockId) as DatabaseBlockModel;
      return dbblock?.title.toString() ?? '';
    },
    constructor: DatabaseBlockDatasource,
  },
  'all-pages': {
    title: (_root: EditorHost, _config: AllPageDatasourceConfig) => {
      return 'All Pages';
    },
    constructor: AllPageDatasource,
  },
  tags: {
    title: (_root: EditorHost, _config: TagsDatasourceConfig) => {
      return 'Tags';
    },
    constructor: TagsDatasource,
  },
};
export const createDatasource = (
  root: EditorHost,
  config: DataSourceConfig
): DataSource => {
  return new datasourceMap[config.type].constructor(root, config as never);
};
export const getDatasourceTitle = (
  root: EditorHost,
  config: DataSourceConfig
): string => {
  return datasourceMap[config.type].title(root, config as never);
};
