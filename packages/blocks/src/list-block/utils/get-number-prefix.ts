function number2letter(n: number) {
  const ordA = 'a'.charCodeAt(0);
  const ordZ = 'z'.charCodeAt(0);
  const len = ordZ - ordA + 1;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
}

// Derive from https://gist.github.com/imilu/00f32c61e50b7ca296f91e9d96d8e976
export function number2roman(num: number) {
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
}

function getPrefix(depth: number, index: number) {
  const map = [() => index + 1, number2letter, () => number2roman(index + 1)];
  return map[depth % map.length](index);
}

export function getNumberPrefix(index: number, depth: number) {
  const prefix = getPrefix(depth, index);
  return `${prefix} .`;
}
