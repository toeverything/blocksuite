import { DatabaseBlockSchema } from '@blocksuite/affine-model';
import {
  BlockNotionHtmlAdapterExtension,
  type BlockNotionHtmlAdapterMatcher,
  HastUtils,
  TextUtils,
} from '@blocksuite/affine-shared/adapters';
import { getTagColor } from '@blocksuite/data-view';
import { type BlockSnapshot, nanoid } from '@blocksuite/store';

const ColumnClassMap: Record<string, string> = {
  typesSelect: 'select',
  typesMultipleSelect: 'multi-select',
  typesNumber: 'number',
  typesCheckbox: 'checkbox',
  typesText: 'rich-text',
  typesTitle: 'title',
};

const NotionDatabaseToken = '.collection-content';
const NotionDatabaseTitleToken = '.collection-title';

type BlocksuiteTableColumn = {
  type: string;
  name: string;
  data: {
    options?: {
      id: string;
      value: string;
      color: string;
    }[];
  };
  id: string;
};

type BlocksuiteTableRow = Record<
  string,
  {
    columnId: string;
    value: unknown;
  }
>;

const DATABASE_NODE_TYPES = ['table', 'th', 'tr'];

export const databaseBlockNotionHtmlAdapterMatcher: BlockNotionHtmlAdapterMatcher =
  {
    flavour: DatabaseBlockSchema.model.flavour,
    toMatch: o =>
      HastUtils.isElement(o.node) &&
      DATABASE_NODE_TYPES.includes(o.node.tagName),
    fromMatch: () => false,
    toBlockSnapshot: {
      enter: (o, context) => {
        if (!HastUtils.isElement(o.node)) {
          return;
        }
        const { walkerContext, deltaConverter, pageMap } = context;
        switch (o.node.tagName) {
          case 'th': {
            const columnId = nanoid();
            const columnTypeClass = HastUtils.querySelector(o.node, 'svg')
              ?.properties?.className;
            const columnType = Array.isArray(columnTypeClass)
              ? (ColumnClassMap[columnTypeClass[0]] ?? 'rich-text')
              : 'rich-text';
            walkerContext.pushGlobalContextStack<BlocksuiteTableColumn>(
              'hast:table:column',
              {
                type: columnType,
                name: HastUtils.getTextContent(
                  HastUtils.getTextChildrenOnlyAst(o.node)
                ),
                data: Object.create(null),
                id: columnId,
              }
            );
            // disable icon img in th
            walkerContext.setGlobalContext('hast:disableimg', true);
            break;
          }
          case 'tr': {
            if (
              o.parent?.node.type === 'element' &&
              o.parent.node.tagName === 'tbody'
            ) {
              const columns =
                walkerContext.getGlobalContextStack<BlocksuiteTableColumn>(
                  'hast:table:column'
                );
              const row = Object.create(null);
              let plainTable = false;
              HastUtils.getElementChildren(o.node).forEach((child, index) => {
                if (plainTable || columns[index] === undefined) {
                  plainTable = true;
                  if (columns[index] === undefined) {
                    columns.push({
                      type: 'rich-text',
                      name: '',
                      data: Object.create(null),
                      id: nanoid(),
                    });
                    walkerContext.pushGlobalContextStack<BlockSnapshot>(
                      'hast:table:children',
                      {
                        type: 'block',
                        id: nanoid(),
                        flavour: 'affine:paragraph',
                        props: {
                          text: {
                            '$blocksuite:internal:text$': true,
                            delta: deltaConverter.astToDelta(child),
                          },
                          type: 'text',
                        },
                        children: [],
                      }
                    );
                  }
                  walkerContext.pushGlobalContextStack<BlockSnapshot>(
                    'hast:table:children',
                    {
                      type: 'block',
                      id: nanoid(),
                      flavour: 'affine:paragraph',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: deltaConverter.astToDelta(child),
                        },
                        type: 'text',
                      },
                      children: [],
                    }
                  );
                  row[columns[index].id] = {
                    columnId: columns[index].id,
                    value: HastUtils.getTextContent(child),
                  };
                } else if (HastUtils.querySelector(child, '.cell-title')) {
                  walkerContext.pushGlobalContextStack<BlockSnapshot>(
                    'hast:table:children',
                    {
                      type: 'block',
                      id: nanoid(),
                      flavour: 'affine:paragraph',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: deltaConverter.astToDelta(child, { pageMap }),
                        },
                        type: 'text',
                      },
                      children: [],
                    }
                  );
                  columns[index].type = 'title';
                  return;
                }
                const optionIds: string[] = [];
                if (HastUtils.querySelector(child, '.selected-value')) {
                  if (!('options' in columns[index].data)) {
                    columns[index].data.options = [];
                  }
                  if (
                    !['multi-select', 'select'].includes(columns[index].type)
                  ) {
                    columns[index].type = 'select';
                  }
                  if (
                    columns[index].type === 'select' &&
                    child.type === 'element' &&
                    child.children.length > 1
                  ) {
                    columns[index].type = 'multi-select';
                  }
                  child.type === 'element' &&
                    child.children.forEach(span => {
                      const filteredArray = columns[index].data.options?.filter(
                        option =>
                          option.value === HastUtils.getTextContent(span)
                      );
                      const id = filteredArray?.length
                        ? filteredArray[0].id
                        : nanoid();
                      if (!filteredArray?.length) {
                        columns[index].data.options?.push({
                          id,
                          value: HastUtils.getTextContent(span),
                          color: getTagColor(),
                        });
                      }
                      optionIds.push(id);
                    });
                  // Expand will be done when leaving the table
                  row[columns[index].id] = {
                    columnId: columns[index].id,
                    value: optionIds,
                  };
                } else if (HastUtils.querySelector(child, '.checkbox')) {
                  if (columns[index].type !== 'checkbox') {
                    columns[index].type = 'checkbox';
                  }
                  row[columns[index].id] = {
                    columnId: columns[index].id,
                    value: HastUtils.querySelector(child, '.checkbox-on')
                      ? true
                      : false,
                  };
                } else if (columns[index].type === 'number') {
                  const text = HastUtils.getTextContent(child);
                  const number = Number(text);
                  if (Number.isNaN(number)) {
                    columns[index].type = 'rich-text';
                    row[columns[index].id] = {
                      columnId: columns[index].id,
                      value: TextUtils.createText(text),
                    };
                  } else {
                    row[columns[index].id] = {
                      columnId: columns[index].id,
                      value: number,
                    };
                  }
                } else {
                  row[columns[index].id] = {
                    columnId: columns[index].id,
                    value: HastUtils.getTextContent(child),
                  };
                }
                if (
                  columns[index].type === 'rich-text' &&
                  !TextUtils.isText(row[columns[index].id].value)
                ) {
                  row[columns[index].id] = {
                    columnId: columns[index].id,
                    value: TextUtils.createText(row[columns[index].id].value),
                  };
                }
              });
              walkerContext.setGlobalContextStack('hast:table:column', columns);
              walkerContext.pushGlobalContextStack('hast:table:rows', row);
            }
          }
        }
      },
      leave: (o, context) => {
        if (!HastUtils.isElement(o.node)) {
          return;
        }
        const { walkerContext } = context;
        switch (o.node.tagName) {
          case 'table': {
            const columns =
              walkerContext.getGlobalContextStack<BlocksuiteTableColumn>(
                'hast:table:column'
              );
            walkerContext.setGlobalContextStack('hast:table:column', []);
            const children = walkerContext.getGlobalContextStack<BlockSnapshot>(
              'hast:table:children'
            );
            walkerContext.setGlobalContextStack('hast:table:children', []);
            const cells = Object.create(null);
            walkerContext
              .getGlobalContextStack<BlocksuiteTableRow>('hast:table:rows')
              .map((row, i) => {
                Object.keys(row).forEach(columnId => {
                  if (
                    columns.find(column => column.id === columnId)?.type ===
                    'select'
                  ) {
                    row[columnId].value = (row[columnId].value as string[])[0];
                  }
                });
                cells[children.at(i)?.id ?? nanoid()] = row;
              });
            walkerContext.setGlobalContextStack('hast:table:cells', []);
            let databaseTitle = '';
            if (
              o.parent?.node.type === 'element' &&
              HastUtils.querySelector(o.parent.node, NotionDatabaseToken)
            ) {
              databaseTitle = HastUtils.getTextContent(
                HastUtils.querySelector(o.parent.node, NotionDatabaseTitleToken)
              );
            }
            walkerContext.openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: DatabaseBlockSchema.model.flavour,
                props: {
                  views: [
                    {
                      id: nanoid(),
                      name: 'Table View',
                      mode: 'table',
                      columns: [],
                      filter: {
                        type: 'group',
                        op: 'and',
                        conditions: [],
                      },
                      header: {
                        titleColumn:
                          columns.find(column => column.type === 'title')?.id ??
                          '',
                        iconColumn: 'type',
                      },
                    },
                  ],
                  title: {
                    '$blocksuite:internal:text$': true,
                    delta: databaseTitle
                      ? [
                          {
                            insert: databaseTitle,
                          },
                        ]
                      : [],
                  },
                  columns,
                  cells,
                },
                children: [],
              },
              'children'
            );
            children.forEach(child => {
              walkerContext.openNode(child, 'children').closeNode();
            });
            walkerContext.closeNode();
            walkerContext.cleanGlobalContextStack('hast:table:column');
            walkerContext.cleanGlobalContextStack('hast:table:rows');
            walkerContext.cleanGlobalContextStack('hast:table:children');
            break;
          }
          case 'th': {
            walkerContext.setGlobalContext('hast:disableimg', false);
            break;
          }
        }
      },
    },
    fromBlockSnapshot: {},
  };

export const DatabaseBlockNotionHtmlAdapterExtension =
  BlockNotionHtmlAdapterExtension(databaseBlockNotionHtmlAdapterMatcher);
