import { createUniComponentFromWebComponent } from '../../../components/uni-component/uni-component.js';
import { tNumber, tString, tTag } from '../../logical/data-type.js';
import { isTArray, tArray } from '../../logical/typesystem.js';
import { groupByMatcher } from './group.js';
import { NumberGroupView } from './groupRenderer/number-group.js';
import { SelectGroupView } from './groupRenderer/select-group.js';
import { StringGroupView } from './groupRenderer/string-group.js';

groupByMatcher.register(tTag.create(), {
  name: 'select',
  defaultKeys: type => {
    if (tTag.is(type) && type.data) {
      return [
        ...type.data.tags.map(v => ({ key: v.id, value: v.id })),
        { key: 'No Tags', value: null },
      ];
    }
    return [];
  },
  valuesGroup: (value, type) => {
    if (value == null) {
      return [{ key: 'No Tags', value }];
    }
    return [{ key: `${value}`, value }];
  },
  view: createUniComponentFromWebComponent(SelectGroupView),
});
groupByMatcher.register(tArray(tTag.create()), {
  name: 'multi-select',
  defaultKeys: type => {
    if (isTArray(type) && tTag.is(type.ele) && type.ele.data) {
      return [
        ...type.ele.data.tags.map(v => ({ key: v.id, value: v.id })),
        { key: 'No Tags', value: null },
      ];
    }
    return [];
  },
  valuesGroup: (value, type) => {
    if (value == null) {
      return [{ key: 'No Tags', value }];
    }
    if (Array.isArray(value)) {
      if (value.length) {
        return value.map(id => ({ key: `${id}`, value: id }));
      }
      return [{ key: 'No Tags', value }];
    }
    return [];
  },
  addToGroup: (value, old) =>
    Array.isArray(old) ? [...old, value] : value ? [value] : [],
  view: createUniComponentFromWebComponent(SelectGroupView),
});
groupByMatcher.register(tString.create(), {
  name: 'text',
  defaultKeys: type => {
    return [];
  },
  valuesGroup: (value, type) => {
    if (value == null) {
      return [{ key: '', value }];
    }
    return [{ key: `${value}`, value }];
  },
  view: createUniComponentFromWebComponent(StringGroupView),
});
groupByMatcher.register(tNumber.create(), {
  name: 'number',
  defaultKeys: type => {
    return [];
  },
  valuesGroup: (value, type) => {
    if (typeof value !== 'number') {
      return [{ key: 'Empty', value }];
    }
    return [
      { key: `${Math.floor(value / 10)}`, value: Math.floor(value / 10) },
    ];
  },
  addToGroup: value => (typeof value === 'number' ? value * 10 : undefined),
  view: createUniComponentFromWebComponent(NumberGroupView),
});
