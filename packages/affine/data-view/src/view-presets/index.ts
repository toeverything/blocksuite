import { kanbanViewConfig } from './kanban/index.js';
import { tableViewConfig } from './table/index.js';

export * from './kanban/index.js';
export * from './table/index.js';
export const viewPresets = {
  tableViewConfig,
  kanbanViewConfig,
};
