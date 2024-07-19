import { describe, expect, it } from 'vitest';

import { AffineSchemas } from '../../schemas.js';

function serializeSchema(schema: (typeof AffineSchemas)[0]) {
  const rawProps =
    (schema.model.props?.({
      Text: () => ({ type: 'text' }),
      Boxed: () => ({ type: 'boxed' }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any) as Record<string, unknown>) || {};

  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawProps)) {
    if (value && typeof value === 'object' && 'type' in value) {
      props[key] = value;
    } else if (value === null) {
      props[key] = {
        type: 'unknown',
        default: null,
      };
    } else if (value === undefined) {
      props[key] = {
        type: 'unknown',
        default: 'undefined',
      };
    } else if (typeof value === 'string') {
      props[key] = {
        type: 'string',
        default: value,
      };
    } else if (typeof value === 'number') {
      props[key] = {
        type: 'number',
        default: value,
      };
    }
  }

  return JSON.stringify(
    {
      flavour: schema.model.flavour,
      metadata: {
        version: schema.version,
        role: schema.model.role,
        parent: schema.model.parent,
        children: schema.model.children,
      },
      props,
    },
    null,
    2
  );
}

describe('serialized block schema', () => {
  it('matches current snapshot', () => {
    const result = AffineSchemas.map(schema => serializeSchema(schema));
    expect(result).toMatchSnapshot();
  });
});
