import type { Variable, VariableOrProperty } from '../types.js';

import { propertyMatcher } from '../../logical/property-matcher.js';

export const getRefType = (vars: Variable[], ref: VariableOrProperty) => {
  if (ref.type === 'ref') {
    return vars.find(v => v.id === ref.name)?.type;
  }
  return propertyMatcher.find(v => v.data.name === ref.propertyFuncName)?.type
    .rt;
};
