import type { DeltaInsert } from '@blocksuite/inline';

import { isEqual } from '@blocksuite/global/utils';

export const fetchImage = async (
  url: string,
  init?: RequestInit,
  proxy?: string
) => {
  try {
    if (!proxy) {
      return await fetch(url, init);
    }
    if (url.startsWith('blob:')) {
      return await fetch(url, init);
    }
    if (url.startsWith('data:')) {
      return await fetch(url, init);
    }
    if (url.startsWith(window.location.origin)) {
      return await fetch(url, init);
    }
    return await fetch(proxy + '?url=' + encodeURIComponent(url), init)
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res;
      })
      .catch(() => fetch(url, init));
  } catch (error) {
    console.warn('Error fetching image:', error);
    return null;
  }
};

export const mergeDeltas = (
  acc: DeltaInsert[],
  cur: DeltaInsert,
  options: { force?: boolean } = { force: false }
) => {
  if (acc.length === 0) {
    return [cur];
  }
  const last = acc[acc.length - 1];
  if (options?.force) {
    last.insert = last.insert + cur.insert;
    last.attributes = Object.create(null);
    return acc;
  } else if (
    typeof last.insert === 'string' &&
    typeof cur.insert === 'string' &&
    (isEqual(last.attributes, cur.attributes) ||
      (last.attributes === undefined && cur.attributes === undefined))
  ) {
    last.insert += cur.insert;
    return acc;
  }
  return [...acc, cur];
};

export const isNullish = (value: unknown) =>
  value === null || value === undefined;

export const fetchable = (url: string) =>
  url.startsWith('http:') ||
  url.startsWith('https:') ||
  url.startsWith('data:');

export const createText = (s: string) => {
  return {
    '$blocksuite:internal:text$': true,
    delta: s.length === 0 ? [] : [{ insert: s }],
  };
};
export const isText = (o: unknown) => {
  if (
    typeof o === 'object' &&
    o !== null &&
    '$blocksuite:internal:text$' in o
  ) {
    return o['$blocksuite:internal:text$'] === true;
  }
  return false;
};

export function toURLSearchParams(
  params?: Partial<Record<string, string | string[]>>
) {
  if (!params) return;

  const items = Object.entries(params)
    .filter(([_, v]) => !isNullish(v))
    .filter(([_, v]) => {
      if (typeof v === 'string') {
        return v.length > 0;
      }
      if (Array.isArray(v)) {
        return v.length > 0;
      }
      return false;
    })
    .map(([k, v]) => [k, Array.isArray(v) ? v.filter(v => v.length) : v]) as [
    string,
    string | string[],
  ][];

  return new URLSearchParams(
    items
      .filter(([_, v]) => v.length)
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
  );
}
