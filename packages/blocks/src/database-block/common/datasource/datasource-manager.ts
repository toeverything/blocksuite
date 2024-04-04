import type { EditorHost } from '@blocksuite/block-std';

import type { DatabaseBlockModel } from '../../database-model.js';
import { AllDocDataSource } from './all-doc-datasource.js';
import type {
  AllDocDataSourceConfig,
  DatabaseBlockDataSourceConfig,
  DataSource,
  DataSourceConfig,
  GetConfig,
  TagsDataSourceConfig,
} from './base.js';
import { DatabaseBlockDataSource } from './database-block-datasource.js';
import { TagsDataSource } from './tags-datasource.js';

const dataSourceMap: {
  [K in DataSourceConfig['type']]: {
    title: (host: EditorHost, config: GetConfig<K>) => string;
    constructor: new (host: EditorHost, config: GetConfig<K>) => DataSource;
  };
} = {
  'database-block': {
    title: (host: EditorHost, config: DatabaseBlockDataSourceConfig) => {
      const dbBlock = host.doc.collection
        .getDoc(config.pageId)
        ?.getBlockById(config.blockId) as DatabaseBlockModel;
      return dbBlock?.title.toString() ?? '';
    },
    constructor: DatabaseBlockDataSource,
  },
  'all-pages': {
    title: (_host: EditorHost, _config: AllDocDataSourceConfig) => {
      return 'All Pages';
    },
    constructor: AllDocDataSource,
  },
  tags: {
    title: (_host: EditorHost, _config: TagsDataSourceConfig) => {
      return 'Tags';
    },
    constructor: TagsDataSource,
  },
};
export const createDataSource = (
  host: EditorHost,
  config: DataSourceConfig
): DataSource => {
  return new dataSourceMap[config.type].constructor(host, config as never);
};
export const getDataSourceTitle = (
  host: EditorHost,
  config: DataSourceConfig
): string => {
  return dataSourceMap[config.type].title(host, config as never);
};
