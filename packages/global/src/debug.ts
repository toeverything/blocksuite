import color from 'ansi-colors';

import { assertEquals, assertExists } from './utils.js';

let enabled = false;
let showStack = false;

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
  const upperStackInfo = stackInfo.slice(1).join('\n');
  const message = stackInfo[callerIdx].trim();
  // For example, the message is:
  // at handleBlockEndEnter (http://localhost:5173/@fs/Users/username/blocksuite/packages/blocks/src/__internal__/rich-text/rich-text-operations.ts?t=1674485091790:41:44)
  // method will match `handleBlockEndEnter`
  // subsystem will match `blocks`
  const method = /at\s(\S*)(?=\s)/.exec(message)?.[1] ?? message;
  const subsystem = /\/packages\/([a-z]+)/.exec(message)?.[1] ?? 'unknown';
  console.log(
    `[packages/${color.blue(subsystem)}] ${color.magenta(
      method
    )}(${info.arguments.map(() => '%o').join(', ')})\n`,
    ...info.arguments,
    showStack ? upperStackInfo : ''
  );
};

const whitelist = new Set<string>();
const all = new Set<string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export const debug = (tag: string) => {
  all.add(tag);
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

export function configDebugLog(verbose: boolean) {
  showStack = verbose;
}

export function enableDebugLog(tags?: string | string[]) {
  color.enabled = true;
  enabled = true;
  if (Array.isArray(tags)) {
    tags.forEach(tag => whitelist.add(tag));
  } else if (tags) {
    whitelist.add(tags);
  } else {
    [...all.values()].forEach(tag => whitelist.add(tag));
  }
}

export function disableDebuglog(tag?: string) {
  if (tag) {
    whitelist.delete(tag);
  } else {
    whitelist.clear();
  }
}
