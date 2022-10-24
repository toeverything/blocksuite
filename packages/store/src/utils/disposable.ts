export interface Disposable {
  dispose(): void;
}

export function flattenDisposable(a: Disposable[]): Disposable {
  return {
    dispose: () => {
      a.forEach(d => {
        try {
          d.dispose();
        } catch (err) {
          console.error(err);
        }
      });
      a.length = 0;
    },
  };
}
