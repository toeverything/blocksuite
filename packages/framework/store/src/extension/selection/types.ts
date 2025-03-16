import type { BaseSelection } from './base';

export interface SelectionConstructor<T extends BaseSelection = BaseSelection> {
  type: string;
  group: string;

  new (...args: any[]): T;
  fromJSON(json: Record<string, unknown>): T;
}
