export function createEnumMap<T extends Record<string, string | number>>(
  EnumObject: T
) {
  return Object.entries(EnumObject).reduce(
    (acc, [key, value]) => {
      acc[value as T[keyof T]] = key as keyof T;
      return acc;
    },
    {} as Record<T[keyof T], keyof T>
  );
}
