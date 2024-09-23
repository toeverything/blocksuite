import { propertyType, tString } from '@blocksuite/data-view';

export const linkColumnType = propertyType('link');
export const linkColumnModelConfig = linkColumnType.modelConfig<string>({
  name: 'Link',
  type: () => tString.create(),
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
