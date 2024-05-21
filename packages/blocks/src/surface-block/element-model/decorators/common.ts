/**
 * Set metadata for a property
 * @param symbol Unique symbol for the metadata
 * @param target The target object to set metadata on, usually the prototype
 * @param prop The property name
 * @param val The value to set
 */
export function setObjectPropMeta(
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
 * Get metadata for a property
 * @param target The target object to retrieve metadata from, usually the prototype
 * @param symbol Unique symbol for the metadata
 * @param prop The property name, if not provided, returns all metadata for that symbol
 * @returns
 */
export function getObjectPropMeta(
  target: unknown,
  symbol: symbol,
  prop?: string | symbol
) {
  if (prop) {
    // @ts-ignore
    return target[symbol]?.[prop] ?? null;
  }

  // @ts-ignore
  return target[symbol] ?? {};
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
