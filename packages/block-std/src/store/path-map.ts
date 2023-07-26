export class PathMap<Value = unknown> {
  private _map = new Map<string, Value>();

  constructor() {
    this._map = new Map();
  }

  static pathToKey = (path: string[]) => {
    return path.join('|');
  };

  static keyToPath = (key: string) => {
    return key.split('|');
  };

  static equals = (path1: string[], path2: string[]) => {
    return PathMap.pathToKey(path1) === PathMap.pathToKey(path2);
  };

  // check if path1 includes path2
  static includes = (path1: string[], path2: string[]) => {
    return PathMap.pathToKey(path1).startsWith(PathMap.pathToKey(path2));
  };

  get(path: string[]) {
    return this._map.get(PathMap.pathToKey(path));
  }

  getPath(value: Value) {
    const key = Array.from(this._map.keys()).find(
      key => this._map.get(key) === value
    );
    if (!key) {
      return null;
    }
    return PathMap.keyToPath(key);
  }

  set(path: string[], value: Value) {
    this._map.set(PathMap.pathToKey(path), value);
  }

  delete(path: string[]) {
    this._map.delete(PathMap.pathToKey(path));
  }

  has(path: string[]) {
    return this._map.has(PathMap.pathToKey(path));
  }

  entries() {
    return Array.from(this._map.entries()).map(value => {
      return [PathMap.keyToPath(value[0]), value[1]] as const;
    });
  }

  values() {
    return Array.from(this._map.values());
  }

  clear() {
    this._map.clear();
  }
}
