import type { BaseBlockModel } from '@blocksuite/store';
import {
  ALLOW_DEFAULT,
  getCurrentRange,
  resetNativeSelection,
  PREVENT_DEFAULT,
} from '../index.js';
import type { KeyboardBindings } from './keyboard.js';

type BracketPair = {
  name: string;
  left: string;
  leftCode: number;
  right: string;
  shiftKey?: boolean;
};

// keyCode refer to https://www.toptal.com/developers/keycode/for/%5B
const bracketPairs: BracketPair[] = [
  {
    name: 'parenthesis',
    left: '(',
    leftCode: 57,
    right: ')',
    shiftKey: true,
  },
  {
    name: 'square bracket',
    left: '[',
    leftCode: 219,
    right: ']',
  },
  {
    name: 'curly bracket',
    left: '{',
    leftCode: 219,
    right: '}',
    shiftKey: true,
  },
  {
    name: 'double quote',
    left: '"',
    leftCode: 222,
    right: '"',
    shiftKey: true,
  },
  {
    name: 'single quote',
    left: "'",
    leftCode: 222,
    right: "'",
  },
  {
    name: 'backtick',
    left: '`',
    leftCode: 192,
    right: '`',
  },
  {
    name: 'angle bracket',
    left: '<',
    leftCode: 188,
    right: '>',
    shiftKey: true,
  },
];

export function createBracketAutoCompleteBindings(
  model: BaseBlockModel
): KeyboardBindings {
  return bracketPairs.reduce((acc, pair) => {
    return {
      ...acc,
      [pair.name]: {
        key: pair.leftCode,
        shiftKey: pair.shiftKey,
        collapsed: false,
        handler(range) {
          if (!model.text) {
            return ALLOW_DEFAULT;
          }
          model.text.insert(pair.left, range.index);
          model.text.insert(pair.right, range.index + range.length + 1);

          const curRange = getCurrentRange();
          // move cursor to the end of the inserted text
          curRange.setStart(curRange.startContainer, curRange.startOffset + 1);
          resetNativeSelection(curRange);
          return PREVENT_DEFAULT;
        },
      },
    } satisfies KeyboardBindings;
  }, {});
}
