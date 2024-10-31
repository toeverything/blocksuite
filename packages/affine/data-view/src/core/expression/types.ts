import type { UniComponent } from '../utils/index.js';
import type { TypeInstance } from '../logical/type.js';

export type VariableRef = {
  type: 'ref';
  name: string;
};

export type Property = {
  type: 'property';
  ref: VariableRef;
  propertyFuncName: string;
};

export type VariableOrProperty = VariableRef | Property;

export type Variable = {
  name: string;
  type: TypeInstance;
  id: string;
  icon?: UniComponent;
};
export type Literal = {
  type: 'literal';
  value: unknown;
};
export type Value = /*VariableRef*/ Literal;
