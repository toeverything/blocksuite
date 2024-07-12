import type { DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function transformDelta<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>
): ('\n' | DeltaInsert<TextAttributes>)[] {
  const result: ('\n' | DeltaInsert<TextAttributes>)[] = [];

  let tmpString = delta.insert;
  while (tmpString.length > 0) {
    const index = tmpString.indexOf('\n');
    if (index === -1) {
      result.push({
        attributes: delta.attributes,
        insert: tmpString,
      });
      break;
    }

    if (tmpString.slice(0, index).length > 0) {
      result.push({
        attributes: delta.attributes,
        insert: tmpString.slice(0, index),
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
export function deltaInsertsToChunks<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>[]
): DeltaInsert<TextAttributes>[][] {
  if (delta.length === 0) {
    return [[]];
  }

  const transformedDelta = delta.flatMap(transformDelta);

  function* chunksGenerator(arr: ('\n' | DeltaInsert<TextAttributes>)[]) {
    let start = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '\n') {
        const chunk = arr.slice(start, i);
        start = i + 1;
        yield chunk as DeltaInsert<TextAttributes>[];
      } else if (i === arr.length - 1) {
        yield arr.slice(start) as DeltaInsert<TextAttributes>[];
      }
    }

    if (arr.at(-1) === '\n') {
      yield [];
    }
  }

  return Array.from(chunksGenerator(transformedDelta));
}
