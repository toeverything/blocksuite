export class PathFinder {
  private constructor() {
    // this is a static class
  }

  static id = (path: readonly string[]) => {
    return path[path.length - 1];
  };

  static parent = (path: readonly string[]) => {
    return path.slice(0, path.length - 1);
  };

  static pathToKey = (path: readonly string[]) => {
    return path.join('|');
  };

  static keyToPath = (key: string) => {
    return key.split('|');
  };

  static equals = (path1: readonly string[], path2: readonly string[]) => {
    return PathFinder.pathToKey(path1) === PathFinder.pathToKey(path2);
  };

  // check if path1 includes path2
  static includes = (path1: string[], path2: string[]) => {
    return PathFinder.pathToKey(path1).startsWith(PathFinder.pathToKey(path2));
  };
}
