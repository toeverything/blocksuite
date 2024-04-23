import { z } from 'zod';

type MappedZodLiterals<T extends readonly z.Primitive[]> = {
  readonly [K in keyof T]: z.ZodLiteral<T[K]>;
};

function createManyUnion<
  A extends Readonly<[z.Primitive, z.Primitive, ...z.Primitive[]]>,
>(literals: A) {
  return z.union(
    literals.map(value => z.literal(value)) as MappedZodLiterals<A>
  );
}

export function createZodUnion<T extends readonly []>(values: T): z.ZodNever;
export function createZodUnion<T extends readonly [z.Primitive]>(
  values: T
): z.ZodLiteral<T[0]>;
export function createZodUnion<
  T extends readonly [z.Primitive, z.Primitive, ...z.Primitive[]],
>(values: T): z.ZodUnion<MappedZodLiterals<T>>;

/**
 * Creating Zod literal union from array
 * @example
 * const arr = [1, 2, 3] as const;
 * createUnionSchemaFromArray(arr); //  z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>
 *
 * const arr = ['a', 'b', 'c'] as const;
 * createUnionSchemaFromArray(arr); // z.ZodUnion<readonly [z.ZodLiteral<"a">, z.ZodLiteral<"b">, z.ZodLiteral<"c">]>
 */
export function createZodUnion<T extends readonly z.Primitive[]>(values: T) {
  if (values.length > 1) {
    return createManyUnion(
      values as T & [z.Primitive, z.Primitive, ...z.Primitive[]]
    );
  }
  if (values.length === 1) {
    return z.literal(values[0]);
  }
  return z.never();
}
