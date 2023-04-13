const IS_MAC = /Mac/i.test(globalThis.navigator?.platform);
export const SHORT_KEY = IS_MAC ? 'command' : 'ctrl';
