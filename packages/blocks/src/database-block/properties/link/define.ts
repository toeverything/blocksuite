import { propertyType, t } from '@blocksuite/data-view';

export const linkColumnType = propertyType('link');
export const linkColumnModelConfig = linkColumnType.modelConfig<string>({
  name: 'Link',
  type: () => t.string.instance(),
  defaultData: () => ({}),
  cellToString: ({ value }) => value?.toString() ?? '',
  cellFromString: ({ value }) => {
    return {
      value: value,
    };
  },
  cellToJson: ({ value }) => value ?? null,
  cellFromJson: ({ value }) => (typeof value !== 'string' ? undefined : value),
  isEmpty: ({ value }) => value == null || value.length == 0,
});
