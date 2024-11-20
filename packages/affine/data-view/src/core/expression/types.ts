import type { TypeInstance } from '../logical/type.js';
import type { UniComponent } from '../utils/index.js';

export type VariableRef = {
  type: 'ref';
  name: string;
};

export type Variable = {
  name: string;
  type: TypeInstance;
  propertyType: string;
  id: string;
  icon?: UniComponent;
};
export type Literal = {
  type: 'literal';
  value: unknown;
};
// TODO support VariableRef
export type Value = Literal;
