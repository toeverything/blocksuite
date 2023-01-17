import color from 'ansi-colors';
import { assertEquals, assertExists } from './utils.js';

let enabled = false;

export const removeStackHeader = (stack: unknown) =>
  String(stack).replace(/^.+\n.+\n/, '');

export const debugLog = function (
  info: {
    arguments: unknown[];
    callerIdx: number;
  } = { arguments: [], callerIdx: 1 }
): void {
  if (!enabled) {
    return;
  }
  const { callerIdx } = info;
  const error = new Error();
  const stackInfo = removeStackHeader(error.stack).split('\n');
  const message = stackInfo[callerIdx].trim();
  const method = /(?<=at\s)(\S*)(?=\s)/.exec(message)?.[0] ?? message;
  const subsystem =
    /(?<=\/packages\/)[a-z]+/.exec(message)?.[0] ?? 'playground';
  console.log(
    `[packages/${color.blue(subsystem)}] ${color.magenta(
      method
    )}(${info.arguments.map(() => '%o').join(', ')})\n`,
    ...info.arguments
  );
};

const whitelist = new Set<string>();

type AnyFunction = (...args: any[]) => any;
export const debug = (tag?: string) => {
  return (
    target: object,
    name: string,
    descriptor: TypedPropertyDescriptor<AnyFunction>
  ) => {
    const original = descriptor.value;
    assertExists(original);
    assertEquals(typeof original, 'function');
    descriptor.value = function debugWrapper(
      this: unknown,
      ...args: unknown[]
    ) {
      if (tag ? whitelist.has(tag) : true) {
        debugLog({
          arguments: args,
          callerIdx: 2,
        });
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
};

export function enableDebugLog(tags: string | string[]) {
  color.enabled = true;
  enabled = true;
  if (Array.isArray(tags)) {
    tags.forEach(tag => whitelist.add(tag));
  } else {
    whitelist.add(tags);
  }
}

export function disableDebuglog(tag?: string) {
  if (tag) {
    whitelist.delete(tag);
  } else {
    whitelist.clear();
  }
}
