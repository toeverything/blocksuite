import type { GroupByConfig } from './types.js';

import { tBoolean, tNumber, tString, tTag } from '../../logical/data-type.js';
import { MatcherCreator } from '../../logical/matcher.js';
import { isTArray, tArray } from '../../logical/typesystem.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/uni-component.js';
import { BooleanGroupView } from './renderer/boolean-group.js';
import { NumberGroupView } from './renderer/number-group.js';
import { SelectGroupView } from './renderer/select-group.js';
import { StringGroupView } from './renderer/string-group.js';

const groupByMatcherCreator = new MatcherCreator<GroupByConfig>();
const ungroups = {
  key: 'Ungroups',
  value: null,
};
export const groupByMatchers = [
  groupByMatcherCreator.createMatcher(tTag.create(), {
    name: 'select',
    groupName: (type, value) => {
      if (tTag.is(type) && type.data) {
        return type.data.tags.find(v => v.id === value)?.value ?? '';
      }
      return '';
    },
    defaultKeys: type => {
      if (tTag.is(type) && type.data) {
        return [
          ungroups,
          ...type.data.tags.map(v => ({
            key: v.id,
            value: v.id,
          })),
        ];
      }
      return [ungroups];
    },
    valuesGroup: (value, _type) => {
      if (value == null) {
        return [ungroups];
      }
      return [
        {
          key: `${value}`,
          value,
        },
      ];
    },
    view: createUniComponentFromWebComponent(SelectGroupView),
  }),
  groupByMatcherCreator.createMatcher(tArray(tTag.create()), {
    name: 'multi-select',
    groupName: (type, value) => {
      if (tTag.is(type) && type.data) {
        return type.data.tags.find(v => v.id === value)?.value ?? '';
      }
      return '';
    },
    defaultKeys: type => {
      if (isTArray(type) && tTag.is(type.ele) && type.ele.data) {
        return [
          ungroups,
          ...type.ele.data.tags.map(v => ({
            key: v.id,
            value: v.id,
          })),
        ];
      }
      return [ungroups];
    },
    valuesGroup: (value, _type) => {
      if (value == null) {
        return [ungroups];
      }
      if (Array.isArray(value)) {
        if (value.length) {
          return value.map(id => ({
            key: `${id}`,
            value: id,
          }));
        }
      }
      return [ungroups];
    },
    addToGroup: (value, old) => {
      if (value == null) {
        return old;
      }
      return Array.isArray(old) ? [...old, value] : [value];
    },
    removeFromGroup: (value, old) => {
      if (Array.isArray(old)) {
        return old.filter(v => v !== value);
      }
      return old;
    },
    view: createUniComponentFromWebComponent(SelectGroupView),
  }),
  groupByMatcherCreator.createMatcher(tString.create(), {
    name: 'text',
    groupName: (_type, value) => {
      return `${value ?? ''}`;
    },
    defaultKeys: _type => {
      return [ungroups];
    },
    valuesGroup: (value, _type) => {
      if (!value) {
        return [ungroups];
      }
      return [
        {
          key: `g:${value}`,
          value,
        },
      ];
    },
    view: createUniComponentFromWebComponent(StringGroupView),
  }),
  groupByMatcherCreator.createMatcher(tNumber.create(), {
    name: 'number',
    groupName: (_type, value) => {
      return `${value ?? ''}`;
    },
    defaultKeys: _type => {
      return [ungroups];
    },
    valuesGroup: (value, _type) => {
      if (typeof value !== 'number') {
        return [ungroups];
      }
      return [
        {
          key: `g:${Math.floor(value / 10)}`,
          value: Math.floor(value / 10),
        },
      ];
    },
    addToGroup: value => (typeof value === 'number' ? value * 10 : undefined),
    view: createUniComponentFromWebComponent(NumberGroupView),
  }),
  groupByMatcherCreator.createMatcher(tBoolean.create(), {
    name: 'boolean',
    groupName: (_type, value) => {
      return `${value?.toString() ?? ''}`;
    },
    defaultKeys: _type => {
      return [
        { key: 'true', value: true },
        { key: 'false', value: false },
      ];
    },
    valuesGroup: (value, _type) => {
      if (typeof value !== 'boolean') {
        return [
          {
            key: 'false',
            value: false,
          },
        ];
      }
      return [
        {
          key: value.toString(),
          value: value,
        },
      ];
    },
    view: createUniComponentFromWebComponent(BooleanGroupView),
  }),
];
