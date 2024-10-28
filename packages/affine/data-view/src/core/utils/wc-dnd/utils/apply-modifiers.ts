import type { Modifier, Modifiers, Transform } from '../types.js';

export function applyModifiers(
  modifiers: Modifiers | undefined,
  { transform, ...args }: Parameters<Modifier>[0]
): Transform {
  return modifiers?.length
    ? modifiers.reduce<Transform>((accumulator, modifier) => {
        return modifier({
          transform: accumulator,
          ...args,
        });
      }, transform)
    : transform;
}
