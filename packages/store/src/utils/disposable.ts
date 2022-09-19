export interface IDisposable {
  dispose(): void;
}

export function flattenDisposable(a: IDisposable[]): IDisposable {
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
