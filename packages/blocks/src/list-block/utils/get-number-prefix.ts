import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

const number2letter = (n: number) => {
  const ordA = 'a'.charCodeAt(0);
  const ordZ = 'z'.charCodeAt(0);
  const len = ordZ - ordA + 1;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
};

// Derive from https://gist.github.com/imilu/00f32c61e50b7ca296f91e9d96d8e976
export const number2roman = (num: number) => {
  const lookup: { [key: string]: number } = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let romanStr = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      romanStr += i;
      num -= lookup[i];
    }
  }
  return romanStr;
};

const numberStyle = styleMap({
  color: '#7389FD',
  font: '14px/26px "Roboto Mono"',
});

const getPrefix = (deep: number, index: number) => {
  const map = [() => index + 1, number2letter, () => number2roman(index + 1)];
  return map[deep % map.length](index);
};

export const getNumberPrefix = ({
  index,
  deep,
}: {
  index: number;
  deep: number;
}) => {
  const prefix = getPrefix(deep, index);
  return html`<div style="${numberStyle}">${prefix} .</div>`;
};
