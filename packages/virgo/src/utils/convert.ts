import type { DeltaInsert } from '../types.js';

/**
 * convert a delta insert array to chunks, each chunk is a line
 */
export function deltaInsersToChunks(delta: DeltaInsert[]): DeltaInsert[][] {
  if (delta.length === 0) {
    return [[]];
  }

  function* chunksGenerator(arr: DeltaInsert[]) {
    let start = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].attributes.type === 'line-break') {
        const chunk = arr.slice(start, i);
        start = i + 1;
        yield chunk;
      } else if (i === arr.length - 1) {
        yield arr.slice(start);
      }
    }

    if (arr[arr.length - 1].attributes.type === 'line-break') {
      yield [];
    }
  }

  return [...chunksGenerator(delta)];
}
