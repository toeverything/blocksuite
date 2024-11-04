import type { DataTypeOf } from '../../logical/data-type.js';
import type { t } from '../../logical/index.js';

export const tagToString = (
  value: (string | undefined)[],
  type: DataTypeOf<typeof t.tag>
) => {
  if (!type.data) {
    return;
  }
  const map = new Map(type.data.map(v => [v.id, v.value]));
  return value
    .flatMap(id => {
      if (id) {
        return map.get(id);
      }
      return [];
    })
    .join(', ');
};
