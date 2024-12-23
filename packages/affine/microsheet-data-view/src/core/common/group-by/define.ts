import type { GroupByConfig } from './types.js';

import { tString } from '../../logical/data-type.js';
import { MatcherCreator } from '../../logical/matcher.js';
import { createUniComponentFromWebComponent } from '../../utils/uni-component/uni-component.js';
import { StringGroupView } from './renderer/string-group.js';

const groupByMatcherCreator = new MatcherCreator<GroupByConfig>();
const ungroups = {
  key: 'Ungroups',
  value: null,
};
export const groupByMatchers = [
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
];
