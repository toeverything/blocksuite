export const ALLOWED_SCHEMES = [
  'http',
  'https',
  'ftp',
  'sftp',
  'mailto',
  'tel',
  // may need support other schemes
];
// I guess you don't want to use the regex base the RFC 5322 Official Standard
// For more detail see https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression/1917982#1917982
const MAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

// For more detail see https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
const URL_REGEX = new RegExp(
  '^' +
    // protocol identifier (optional)
    // short syntax // still required
    '(?:(?:(?:https?|ftp):)?\\/\\/)' +
    // user:pass BasicAuth (optional)
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // IP address exclusion
    // private & local networks
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broadcast addresses
    // (first & last IP address of each class)
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    // host & domain names, may end with dot
    // can be replaced by a shortest alternative
    // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
    '(?:' +
    '(?:' +
    '[a-z0-9\\u00a1-\\uffff]' +
    '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
    ')?' +
    '[a-z0-9\\u00a1-\\uffff]\\.' +
    ')+' +
    // TLD identifier name, may end with dot
    // Addition: We limit the TLD to 2-6 characters, because it can cover most of the cases.
    '(?:[a-z\\u00a1-\\uffff]{2,6}\\.?)' +
    ')' +
    // port number (optional)
    '(?::\\d{2,5})?' +
    // resource path (optional)
    '(?:[/?#]\\S*)?' +
    '$',
  'i'
);

export function normalizeUrl(url: string) {
  const includeScheme = ALLOWED_SCHEMES.find(scheme =>
    url.startsWith(scheme + ':')
  );
  if (includeScheme) {
    // Any link include schema is a valid url
    return url;
  }
  const isEmail = MAIL_REGEX.test(url);
  if (isEmail) {
    return 'mailto:' + url;
  }
  return 'http://' + url;
}

/**
 * Assume user will input a url, we just need to check if it is valid.
 *
 * For more detail see https://www.ietf.org/rfc/rfc1738.txt
 */
export const isValidUrl = (str: string) => {
  if (!str) {
    return false;
  }
  const url = normalizeUrl(str);
  if (url === str) {
    // Skip check if user input scheme manually
    try {
      new URL(url);
    } catch {
      return false;
    }
    return true;
  }
  return URL_REGEX.test(url);
};

// https://en.wikipedia.org/wiki/Top-level_domain
const COMMON_TLDS = [
  'com',
  'org',
  'net',
  'edu',
  'gov',
  'co',
  'io',
  'me',
  'moe',
  'mil',
  'top',
  'dev',
  'xyz',
  'info',
  'cat',
  'ru',
  'de',
  'jp',
  'uk',
  'pro',
];

const isCommonTLD = (url: URL) => {
  const tld = url.hostname.split('.').pop();
  if (!tld) {
    return false;
  }
  return COMMON_TLDS.includes(tld);
};

/**
 * Assuming the user will input anything, we need to check rigorously.
 */
export const isStrictUrl = (str: string) => {
  if (!isValidUrl(str)) {
    return false;
  }
  const url = new URL(normalizeUrl(str));
  if (isCommonTLD(url)) {
    return true;
  }
  return false;
};
