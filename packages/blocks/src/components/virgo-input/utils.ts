export function isDecimal(str: string) {
  const reg = new RegExp(/^-?\d+(,\d+)*(\.\d+(e\d+)?)?$/);
  return reg.test(str);
}
