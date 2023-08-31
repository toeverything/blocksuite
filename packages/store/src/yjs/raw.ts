import * as Y from 'yjs';

export class Raw<T = unknown> extends Y.Map<T> {
  constructor(value: T) {
    const entry: [string, T] = ['value', value];
    super([entry]);
  }

  setValue(value: T) {
    return super.set('value', value);
  }

  getValue() {
    return super.get('value');
  }
}
