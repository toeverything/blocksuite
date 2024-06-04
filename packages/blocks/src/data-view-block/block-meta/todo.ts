import { columnPresets } from '../../database-block/index.js';
import {
  type ListBlockModel,
  ListBlockSchema,
} from '../../list-block/index.js';
import { richTextColumnConfig } from '../columns/rich-text/cell-renderer.js';
import { createBlockMeta } from './base.js';

export const todoMeta = createBlockMeta<ListBlockModel>({
  selector: block => {
    if (block.flavour !== ListBlockSchema.model.flavour) {
      return false;
    }

    return (block.model as ListBlockModel).type === 'todo';
  },
});
todoMeta.addProperty({
  name: 'Content',
  key: 'todo-title',
  columnMeta: richTextColumnConfig,
  get: block => block.text.yText,
  set: (_block, _value) => {
    //
  },
  updated: (block, callback) => {
    block.text?.yText.observe(callback);
    return {
      dispose: () => {
        block.text?.yText.unobserve(callback);
      },
    };
  },
});
todoMeta.addProperty({
  name: 'Checked',
  key: 'todo-checked',
  columnMeta: columnPresets.checkboxColumnConfig,
  get: block => block.checked,
  set: (block, value) => {
    block.checked = value;
  },
  updated: (block, callback) => {
    return block.propsUpdated.on(({ key }) => {
      if (key === 'checked') {
        callback();
      }
    });
  },
});

todoMeta.addProperty({
  name: 'Source',
  key: 'todo-source',
  columnMeta: columnPresets.textColumnConfig,
  get: block => block.doc.meta?.title ?? '',
  updated: (block, callback) => {
    return block.doc.collection.meta.docMetaUpdated.on(() => {
      callback();
    });
  },
});
