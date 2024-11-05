import type { Variable, VariableRef } from '../types.js';

export const getRefType = (vars: Variable[], ref: VariableRef) => {
  return vars.find(v => v.id === ref.name)?.type;
};
