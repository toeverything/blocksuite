import type { DeltaInsert } from '../types.js';

// TODO unit test
function transformDelta(delta: DeltaInsert): (DeltaInsert | '\n')[] {
  const result: (DeltaInsert | '\n')[] = [];

  let tmpString = delta.insert;
  while (tmpString.length > 0) {
    const index = tmpString.indexOf('\n');
    if (index === -1) {
      result.push({
        insert: tmpString,
        attributes: delta.attributes,
      });
      break;
    }

    if (tmpString.slice(0, index).length > 0) {
      result.push({
        insert: tmpString.slice(0, index),
        attributes: delta.attributes,
      });
    }

    result.push('\n');
    tmpString = tmpString.slice(index + 1);
  }

  return result;
}

/**
 * convert a delta insert array to chunks, each chunk is a line
 */
export function deltaInsersToChunks(delta: DeltaInsert[]): DeltaInsert[][] {
  if (delta.length === 0) {
    return [[]];
  }

  const transformedDelta = delta.flatMap(transformDelta);

  function* chunksGenerator(arr: (DeltaInsert | '\n')[]) {
    let start = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '\n') {
        const chunk = arr.slice(start, i);
        start = i + 1;
        yield chunk as DeltaInsert[];
      } else if (i === arr.length - 1) {
        yield arr.slice(start) as DeltaInsert[];
      }
    }

    if (arr.at(-1) === '\n') {
      yield [];
    }
  }

  return [...chunksGenerator(transformedDelta)];
}
