import type { EditorHost } from '@blocksuite/block-std';

import type { DatabaseBlockModel } from '../../database-model.js';
import { AllDocDatasource } from './all-doc-datasource.js';
import type {
  AllDocDatasourceConfig,
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
      const dbblock = host.doc.collection
        .getDoc(config.pageId)
        ?.getBlockById(config.blockId) as DatabaseBlockModel;
      return dbblock?.title.toString() ?? '';
    },
    constructor: DatabaseBlockDatasource,
  },
  'all-pages': {
    title: (_host: EditorHost, _config: AllDocDatasourceConfig) => {
      return 'All Pages';
    },
    constructor: AllDocDatasource,
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
