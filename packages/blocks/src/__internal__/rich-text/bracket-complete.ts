import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';

import { getCurrentNativeRange, resetNativeSelection } from '../index.js';
import type { KeyboardBindings } from './keyboard.js';

type BracketPair = {
  name: string;
  left: string;
  right: string;
};

const bracketPairs: BracketPair[] = [
  {
    name: 'parenthesis',
    left: '(',
    right: ')',
  },
  {
    name: 'square bracket',
    left: '[',
    right: ']',
  },
  {
    name: 'curly bracket',
    left: '{',
    right: '}',
  },
  {
    name: 'single quote',
    left: "'",
    right: "'",
  },
  {
    name: 'double quote',
    left: '"',
    right: '"',
  },
  // {
  //   name: 'backtick',
  //   left: '`',
  //   right: '`',
  // },
  {
    name: 'angle bracket',
    left: '<',
    right: '>',
  },
  {
    name: 'fullwidth single quote',
    left: '‘',
    right: '’',
  },
  {
    name: 'fullwidth double quote',
    left: '“',
    right: '”',
  },
  {
    name: 'fullwidth parenthesis',
    left: '（',
    right: '）',
  },
  {
    name: 'fullwidth square bracket',
    left: '【',
    right: '】',
  },
  {
    name: 'fullwidth angle bracket',
    left: '《',
    right: '》',
  },
  {
    name: 'corner bracket',
    left: '「',
    right: '」',
  },
  {
    name: 'white corner bracket',
    left: '『',
    right: '』',
  },
];

export function createBracketAutoCompleteBindings(
  model: BaseBlockModel
): KeyboardBindings {
  const bindings: KeyboardBindings = {};

  bracketPairs.forEach(pair => {
    bindings[pair.name] = {
      key: pair.left,
      // Input some brackets need to press shift key
      shiftKey: null,
      collapsed: false,
      handler(range) {
        if (!model.text) return ALLOW_DEFAULT;

        model.text.insert(pair.left, range.index);
        model.text.insert(pair.right, range.index + range.length + 1);

        const curRange = getCurrentNativeRange();
        // move cursor to the end of the inserted text
        curRange.setStart(curRange.startContainer, curRange.startOffset + 1);
        resetNativeSelection(curRange);
        return PREVENT_DEFAULT;
      },
    };
  });

  bindings['backtick'] = {
    key: '`',
    collapsed: false,
    handler(range, context) {
      if (!model.text) return ALLOW_DEFAULT;
      model.text.format(range.index, range.length, { code: true });
      return PREVENT_DEFAULT;
    },
  };
  return bindings;
}
