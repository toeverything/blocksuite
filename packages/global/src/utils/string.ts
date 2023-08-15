function escapeRegExp(input: string) {
  // escape regex characters in the input string to prevent regex format errors
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if the name is a fuzzy match of the query.
 *
 * @example
 * ```ts
 * const name = 'John Smith';
 * const query = 'js';
 * const isMatch = isFuzzyMatch(name, query);
 * // isMatch: true
 * ```
 */
export function isFuzzyMatch(name: string, query: string) {
  const pureName = name
    .trim()
    .toLowerCase()
    .split('')
    .filter(char => char !== ' ')
    .join('');

  const regex = new RegExp(
    query
      .split('')
      .filter(char => char !== ' ')
      .map(item => `${escapeRegExp(item)}.*`)
      .join(''),
    'i'
  );
  return regex.test(pureName);
}

export function toHex(color: string) {
  let r, g, b;

  if (color.startsWith('#')) {
    color = color.substr(1);
    if (color.length === 3) {
      color = color.replace(/./g, '$&$&');
    }
    [r, g, b] = color.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) ?? [];
  } else if (color.startsWith('rgba')) {
    [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
  } else if (color.startsWith('rgb')) {
    [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
  } else {
    throw new Error('Invalid color format');
  }

  if (r === undefined || g === undefined || b === undefined) {
    throw new Error('Invalid color format');
  }

  const hex = ((r << 16) | (g << 8) | b).toString(16);
  return '#' + '0'.repeat(6 - hex.length) + hex;
}

export function capitalize(s: string) {
  if (!s.length) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}

export function uncapitalize(s: string) {
  if (!s.length) {
    return s;
  }
  return s[0].toLowerCase() + s.slice(1);
}
