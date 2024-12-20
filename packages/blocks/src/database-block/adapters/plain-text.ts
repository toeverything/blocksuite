import type { DeltaInsert } from '@blocksuite/inline';
import type { BlockSnapshot } from '@blocksuite/store';

import {
  type Column,
  DatabaseBlockSchema,
  type SerializedCells,
} from '@blocksuite/affine-model';
import {
  BlockPlainTextAdapterExtension,
  type BlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-shared/adapters';
import { format } from 'date-fns/format';

import { formatTable } from './utils.js';

export const databaseBlockPlainTextAdapterMatcher: BlockPlainTextAdapterMatcher =
  {
    flavour: DatabaseBlockSchema.model.flavour,
    toMatch: () => false,
    fromMatch: o => o.node.flavour === DatabaseBlockSchema.model.flavour,
    toBlockSnapshot: {},
    fromBlockSnapshot: {
      enter: (o, context) => {
        const { walkerContext, deltaConverter } = context;
        const rows: string[][] = [];
        const columns = o.node.props.columns as Array<Column>;
        const children = o.node.children;
        const cells = o.node.props.cells as SerializedCells;
        const tableCells = children.map((v: BlockSnapshot) =>
          columns.map(col => {
            const cell = cells[v.id]?.[col.id];
            if (!cell && col.type !== 'title') {
              return '';
            }
            switch (col.type) {
              case 'rich-text':
                return deltaConverter
                  .deltaToAST((cell.value as { delta: DeltaInsert[] }).delta)
                  .join('');
              case 'title':
                return deltaConverter
                  .deltaToAST((v.props.text as { delta: DeltaInsert[] }).delta)
                  .join('');
              case 'date':
                return format(new Date(cell.value as number), 'yyyy-MM-dd');
              case 'select': {
                const value = (
                  col.data as { options: Array<Record<string, string>> }
                ).options.find(opt => opt.id === cell.value)?.value;
                return value || '';
              }
              case 'multi-select': {
                const value = (cell.value as string[])
                  .map(
                    val =>
                      (
                        col.data as { options: Array<Record<string, string>> }
                      ).options.find(opt => val === opt.id)?.value
                  )
                  .filter(Boolean)
                  .join(',');
                return value || '';
              }
              default:
                return String(cell.value);
            }
          })
        );

        // Handle first row.
        if (Array.isArray(columns)) {
          rows.push(columns.map(col => col.name));
        }

        // Handle 2-... rows
        tableCells.forEach(children => {
          rows.push(children);
        });

        // Convert rows to table string
        const tableString = formatTable(rows);

        context.textBuffer.content += tableString;
        context.textBuffer.content += '\n';

        walkerContext.skipAllChildren();
      },
    },
  };

export const DatabaseBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(databaseBlockPlainTextAdapterMatcher);
