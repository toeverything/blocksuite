import type { BaseBlockModel } from '@blocksuite/store';
import type { VKeyboardBindingRecord } from '@blocksuite/virgo';

import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '../consts.js';

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
): VKeyboardBindingRecord {
  const bindings: VKeyboardBindingRecord = {};

  bracketPairs.forEach(pair => {
    bindings[pair.name] = {
      key: pair.left,
      handler: ({ vRange, vEditor }) => {
        if (!model.text || vRange.length > 0) return ALLOW_DEFAULT;

        model.text.insert(pair.left, vRange.index);
        model.text.insert(pair.right, vRange.index + vRange.length + 1);

        vEditor.setVRange({
          index: vRange.index + 1,
          length: vRange.length,
        });

        return PREVENT_DEFAULT;
      },
    };
  });

  bindings['backtick'] = {
    key: '`',
    handler: ({ vRange, vEditor }) => {
      if (!model.text || vRange.length > 0) return ALLOW_DEFAULT;
      model.text.format(vRange.index, vRange.length, { code: true });

      vEditor.setVRange({
        index: vRange.index,
        length: vRange.length,
      });

      return PREVENT_DEFAULT;
    },
  };
  return bindings;
}
