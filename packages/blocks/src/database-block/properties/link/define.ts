import { propertyType, t } from '@blocksuite/data-view';

export const linkColumnType = propertyType('link');
export const linkColumnModelConfig = linkColumnType.modelConfig<string>({
  name: 'Link',
  type: () => t.string.instance(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null || data.length == 0,
});
