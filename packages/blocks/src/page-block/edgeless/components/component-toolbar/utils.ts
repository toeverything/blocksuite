export function countBy<T>(items: T[], key: (item: T) => string | number) {
  const count: Record<string, number> = {};
  items.forEach(item => {
    const k = key(item);
    if (!count[k]) {
      count[k] = 0;
    }
    count[k] += 1;
  });
  return count;
}

export function maxBy<T>(items: T[], value: (item: T) => number) {
  if (!items.length) {
    return null;
  }
  let maxItem = items[0];
  let max = value(maxItem);

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const v = value(item);
    if (v > max) {
      max = v;
      maxItem = item;
    }
  }

  return maxItem;
}
