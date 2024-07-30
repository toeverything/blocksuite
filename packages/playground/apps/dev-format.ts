import type { BlockModel } from '@blocksuite/store';

import * as globalUtils from '@blocksuite/global/utils';

function toStyledEntry(key: string, value: unknown) {
  return [
    ['span', { style: 'color: #c0c0c0' }, ` ${key}`],
    ['span', { style: 'color: #fff' }, `: `],
    ['span', { style: 'color: rgb(92, 213, 251)' }, `${JSON.stringify(value)}`],
  ];
}

export const devtoolsFormatter: typeof window.devtoolsFormatters = [
  {
    header: function (obj: unknown) {
      if ('flavour' in (obj as BlockModel) && 'yBlock' in (obj as BlockModel)) {
        globalUtils.assertType<BlockModel>(obj);
        return [
          'span',
          { style: 'font-weight: bolder;' },
          ['span', { style: 'color: #fff' }, `Block {`],
          ...toStyledEntry('flavour', obj.flavour),
          ['span', { style: 'color: #fff' }, `,`],
          ...toStyledEntry('id', obj.id),
          ['span', { style: 'color: #fff' }, `}`],
        ] as HTMLTemplate;
      }

      return null;
    },
    hasBody: (obj: unknown) => {
      if ('flavour' in (obj as BlockModel) && 'yBlock' in (obj as BlockModel)) {
        return true;
      }

      return null;
    },
    body: (obj: unknown) => {
      if ('flavour' in (obj as BlockModel) && 'yBlock' in (obj as BlockModel)) {
        globalUtils.assertType<BlockModel>(obj);

        // @ts-ignore
        const { props } = obj.page._blockTree.getBlock(obj.id)._parseYBlock();

        const propsArr = Object.entries(props).flatMap(([key]) => {
          return [
            // @ts-ignore
            ...toStyledEntry(key, obj[key]),
            ['div', {}, ''],
          ] as HTMLTemplate[];
        });

        return ['div', { style: 'padding-left: 1em' }, ...propsArr];
      }

      return null;
    },
  },
];

window.devtoolsFormatters = devtoolsFormatter;
