class CircularPicker<T> {
  private _list: T[];
  private _current = 0;

  constructor(array: T[]) {
    this._list = [...array];
  }

  pick(): T {
    return this._list[this._current++ % this._list.length];
  }
}

export const multiPlayersColor = new CircularPicker([
  'var(--affine-multi-players-purple)',
  'var(--affine-multi-players-magenta)',
  'var(--affine-multi-players-red)',
  'var(--affine-multi-players-orange)',
  'var(--affine-multi-players-green)',
  'var(--affine-multi-players-blue)',
  'var(--affine-multi-players-brown)',
  'var(--affine-multi-players-grey)',
]);
