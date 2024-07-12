interface BracketPair {
  left: string;
  name: string;
  right: string;
}

export const bracketPairs: BracketPair[] = [
  {
    left: '(',
    name: 'parenthesis',
    right: ')',
  },
  {
    left: '[',
    name: 'square bracket',
    right: ']',
  },
  {
    left: '{',
    name: 'curly bracket',
    right: '}',
  },
  {
    left: "'",
    name: 'single quote',
    right: "'",
  },
  {
    left: '"',
    name: 'double quote',
    right: '"',
  },
  {
    left: '<',
    name: 'angle bracket',
    right: '>',
  },
  {
    left: '‘',
    name: 'fullwidth single quote',
    right: '’',
  },
  {
    left: '“',
    name: 'fullwidth double quote',
    right: '”',
  },
  {
    left: '（',
    name: 'fullwidth parenthesis',
    right: '）',
  },
  {
    left: '【',
    name: 'fullwidth square bracket',
    right: '】',
  },
  {
    left: '《',
    name: 'fullwidth angle bracket',
    right: '》',
  },
  {
    left: '「',
    name: 'corner bracket',
    right: '」',
  },
  {
    left: '『',
    name: 'white corner bracket',
    right: '』',
  },
];
