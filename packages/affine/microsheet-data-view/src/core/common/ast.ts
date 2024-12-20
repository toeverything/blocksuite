import type { TType } from '../logical/typesystem.js';
import type { UniComponent } from '../utils/uni-component/uni-component.js';

export type Variable = {
  name: string;
  type: TType;
  id: string;
  icon?: UniComponent;
};
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

export type Literal = {
  type: 'literal';
  value: unknown;
};
export type Value = /*VariableRef*/ Literal;
export type GroupExp = {
  left: VariableOrProperty;
  type: 'asc' | 'desc';
};

export type GroupList = GroupExp[];
