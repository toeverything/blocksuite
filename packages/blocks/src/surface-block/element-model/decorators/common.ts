export function setObjectMeta(
  symbol: symbol,
  target: unknown,
  prop: string | symbol,
  val: unknown
) {
  // @ts-ignore
  target[symbol] = target[symbol] ?? {};
  // @ts-ignore
  target[symbol][prop] = val;
}

/**
 * Decorator state is used to control decorator's behaviour.
 * Eg., yfield decorator will pause executioon when creating model from existing ymap because that would cause
 * the existing value get overrided by default value.
 * @returns
 */
const state: {
  creating: boolean;
  deriving: boolean;
  skipYfield: boolean;
} = {
  creating: false,
  deriving: false,
  skipYfield: false,
};

export function getDecoratorState() {
  return state;
}
