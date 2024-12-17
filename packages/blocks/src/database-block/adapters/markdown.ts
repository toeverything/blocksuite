import type { DeltaInsert } from '@blocksuite/inline';
import type { TableRow } from 'mdast';

import {
  type Column,
  DatabaseBlockSchema,
  type SerializedCells,
} from '@blocksuite/affine-model';
import {
  BlockMarkdownAdapterExtension,
  type BlockMarkdownAdapterMatcher,
  type MarkdownAST,
  TextUtils,
} from '@blocksuite/affine-shared/adapters';
import { type BlockSnapshot, nanoid } from '@blocksuite/store';
import { format } from 'date-fns/format';

const DATABASE_NODE_TYPES = ['table', 'tableRow'];

const isDatabaseNode = (node: MarkdownAST) =>
  DATABASE_NODE_TYPES.includes(node.type);

export const databaseBlockMarkdownAdapterMatcher: BlockMarkdownAdapterMatcher =
  {
    flavour: DatabaseBlockSchema.model.flavour,
    toMatch: o => isDatabaseNode(o.node),
    fromMatch: o => o.node.flavour === DatabaseBlockSchema.model.flavour,
    toBlockSnapshot: {
      enter: (o, context) => {
        const { walkerContext } = context;
        if (o.node.type === 'table') {
          const viewsColumns = o.node.children[0].children.map(() => {
            return {
              id: nanoid(),
              hide: false,
              width: 180,
            };
          });
          const cells = Object.create(null);
          o.node.children.slice(1).forEach(row => {
            const rowId = nanoid();
            cells[rowId] = Object.create(null);
            row.children.slice(1).forEach((cell, index) => {
              cells[rowId][viewsColumns[index + 1].id] = {
                columnId: viewsColumns[index + 1].id,
                value: TextUtils.createText(
                  cell.children
                    .map(child => ('value' in child ? child.value : ''))
                    .join('')
                ),
              };
            });
          });
          const columns = o.node.children[0].children.map((_child, index) => {
            return {
              type: index === 0 ? 'title' : 'rich-text',
              name: _child.children
                .map(child => ('value' in child ? child.value : ''))
                .join(''),
              data: {},
              id: viewsColumns[index].id,
            };
          });
          walkerContext.openNode(
            {
              type: 'block',
              id: nanoid(),
              flavour: 'affine:database',
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
                      titleColumn: viewsColumns[0]?.id,
                      iconColumn: 'type',
                    },
                  },
                ],
                title: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                cells,
                columns,
              },
              children: [],
            },
            'children'
          );
          walkerContext.setNodeContext(
            'affine:table:rowid',
            Object.keys(cells)
          );
          walkerContext.skipChildren(1);
        }

        if (o.node.type === 'tableRow') {
          const { deltaConverter } = context;
          walkerContext
            .openNode({
              type: 'block',
              id:
                (
                  walkerContext.getNodeContext(
                    'affine:table:rowid'
                  ) as Array<string>
                ).shift() ?? nanoid(),
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: deltaConverter.astToDelta(o.node.children[0]),
                },
                type: 'text',
              },
              children: [],
            })
            .closeNode();
          walkerContext.skipAllChildren();
        }
      },
      leave: (o, context) => {
        const { walkerContext } = context;
        if (o.node.type === 'table') {
          walkerContext.closeNode();
        }
      },
    },
    fromBlockSnapshot: {
      enter: (o, context) => {
        const { walkerContext, deltaConverter } = context;
        const rows: TableRow[] = [];
        const columns = o.node.props.columns as Array<Column>;
        const children = o.node.children;
        const cells = o.node.props.cells as SerializedCells;
        const createAstCell = (children: MarkdownAST[]) => ({
          type: 'tableCell',
          children,
        });
        const mdAstCells = Array.prototype.map.call(
          children,
          (v: BlockSnapshot) =>
            Array.prototype.map.call(columns, col => {
              const cell = cells[v.id]?.[col.id];
              if (!cell && col.type !== 'title') {
                return createAstCell([{ type: 'text', value: '' }]);
              }
              switch (col.type) {
                case 'link':
                case 'progress':
                case 'number':
                  return createAstCell([
                    {
                      type: 'text',
                      value: cell.value as string,
                    },
                  ]);
                case 'rich-text':
                  return createAstCell(
                    deltaConverter.deltaToAST(
                      (cell.value as { delta: DeltaInsert[] }).delta
                    )
                  );
                case 'title':
                  return createAstCell(
                    deltaConverter.deltaToAST(
                      (v.props.text as { delta: DeltaInsert[] }).delta
                    )
                  );
                case 'date':
                  return createAstCell([
                    {
                      type: 'text',
                      value: format(
                        new Date(cell.value as number),
                        'yyyy-MM-dd'
                      ),
                    },
                  ]);
                case 'select': {
                  const value = col.data.options.find(
                    (opt: Record<string, string>) => opt.id === cell.value
                  )?.value;
                  return createAstCell([{ type: 'text', value }]);
                }
                case 'multi-select': {
                  const value = Array.prototype.map
                    .call(
                      cell.value,
                      val =>
                        col.data.options.find(
                          (opt: Record<string, string>) => val === opt.id
                        ).value
                    )
                    .filter(Boolean)
                    .join(',');
                  return createAstCell([{ type: 'text', value }]);
                }
                case 'checkbox': {
                  return createAstCell([
                    { type: 'text', value: cell.value as string },
                  ]);
                }
                default:
                  return createAstCell([
                    { type: 'text', value: cell.value as string },
                  ]);
              }
            })
        );

        // Handle first row.
        if (Array.isArray(columns)) {
          rows.push({
            type: 'tableRow',
            children: Array.prototype.map.call(columns, v =>
              createAstCell([
                {
                  type: 'text',
                  value: v.name,
                },
              ])
            ) as [],
          });
        }

        // Handle 2-... rows
        Array.prototype.forEach.call(mdAstCells, children => {
          rows.push({ type: 'tableRow', children });
        });

        walkerContext
          .openNode({
            type: 'table',
            children: rows,
          })
          .closeNode();

        walkerContext.skipAllChildren();
      },
    },
  };

export const DatabaseBlockMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(databaseBlockMarkdownAdapterMatcher);
