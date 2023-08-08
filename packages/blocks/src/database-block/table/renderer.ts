import { createIcon } from '../../components/icon/uni-icon.js';
import { createUniComponentFromWebComponent } from '../../components/uni-component/uni-component.js';
import { viewRendererManager } from '../common/data-view.js';
import { DatabaseTable } from './table-view.js';

viewRendererManager.register('table', {
  view: createUniComponentFromWebComponent(DatabaseTable),
  icon: createIcon('DatabaseTableViewIcon'),
});
