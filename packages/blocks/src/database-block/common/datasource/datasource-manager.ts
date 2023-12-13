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
    title: (host: EditorHost, config: GetConfig<K>) => string;
    constructor: new (host: EditorHost, config: GetConfig<K>) => DataSource;
  };
} = {
  'database-block': {
    title: (host: EditorHost, config: DatabaseBlockDatasourceConfig) => {
      const dbblock = host.page.workspace
        .getPage(config.pageId)
        ?.getBlockById(config.blockId) as DatabaseBlockModel;
      return dbblock?.title.toString() ?? '';
    },
    constructor: DatabaseBlockDatasource,
  },
  'all-pages': {
    title: (_host: EditorHost, _config: AllPageDatasourceConfig) => {
      return 'All Pages';
    },
    constructor: AllPageDatasource,
  },
  tags: {
    title: (_host: EditorHost, _config: TagsDatasourceConfig) => {
      return 'Tags';
    },
    constructor: TagsDatasource,
  },
};
export const createDatasource = (
  host: EditorHost,
  config: DataSourceConfig
): DataSource => {
  return new datasourceMap[config.type].constructor(host, config as never);
};
export const getDatasourceTitle = (
  host: EditorHost,
  config: DataSourceConfig
): string => {
  return datasourceMap[config.type].title(host, config as never);
};
