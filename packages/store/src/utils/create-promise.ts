/**
 * Create a {@link Promise} which can be resolved outside of
 * the `Promise` construction closure.
 */
export function createPromise<T>() {
  const control = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    res: null! as (value: T) => unknown,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    rej: null! as (err: unknown) => unknown,
    promise: new Promise<T>((res, rej) => {
      control.res = res;
      control.rej = rej;
    }),
  };
  return control;
}
