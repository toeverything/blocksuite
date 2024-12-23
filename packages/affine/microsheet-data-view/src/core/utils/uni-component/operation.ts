import type { UniComponent } from './uni-component.js';

export const uniMap = <T, R, P extends NonNullable<unknown>>(
  component: UniComponent<T, P>,
  map: (r: R) => T
): UniComponent<R, P> => {
  return (ele, props) => {
    const result = component(ele, map(props));
    return {
      unmount: result.unmount,
      update: props => {
        result.update(map(props));
      },
      expose: result.expose,
    };
  };
};
