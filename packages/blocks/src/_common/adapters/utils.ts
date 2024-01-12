import { isEqual } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline';

export const fetchImage = async (
  url: string,
  init?: RequestInit,
  proxy?: string
) => {
  if (!proxy) {
    return fetch(url, init);
  }
  return fetch(proxy + '?url=' + encodeURIComponent(url), init).catch(() => {
    console.warn('Failed to fetch image from proxy, fallback to originial url');
    return fetch(url, init);
  });
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
