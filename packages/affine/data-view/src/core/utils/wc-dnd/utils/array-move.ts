/**
 * Move an array item to a different position. Returns a new array with the item moved to the new position.
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  const value = newArray.splice(from, 1)[0];
  if (value == null) {
    return newArray;
  }
  newArray.splice(to < 0 ? newArray.length + to : to, 0, value);

  return newArray;
}
