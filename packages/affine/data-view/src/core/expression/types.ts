import type { TType } from '../logical/index.js';
import type { UniComponent } from '../utils/index.js';

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
  type: TType;
  id: string;
  icon?: UniComponent;
};
export type Literal = {
  type: 'literal';
  value: unknown;
};
export type Value = /*VariableRef*/ Literal;
