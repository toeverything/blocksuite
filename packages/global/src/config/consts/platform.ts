const IS_SAFARI = /Apple Computer/.test(globalThis.navigator?.vendor);
export const IS_IOS =
  IS_SAFARI &&
  (/Mobile\/\w+/.test(globalThis.navigator?.userAgent) ||
    globalThis.navigator?.maxTouchPoints > 2);
export const IS_MAC = /Mac/i.test(globalThis.navigator?.platform);
export const SHORT_KEY = IS_MAC ? 'command' : 'ctrl';
