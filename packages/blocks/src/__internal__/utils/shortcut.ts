const IS_SAFARI = /Apple Computer/.test(navigator.vendor);
const IS_IOS =
  IS_SAFARI &&
  (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2);
const IS_MAC = /Mac/i.test(navigator.platform);

export const SHORTKEY = IS_IOS || IS_MAC ? 'metaKey' : 'ctrlKey';
