import type { AffineTextAttributes } from '@blocksuite/affine-components/rich-text';
import type { DeltaInsert } from '@blocksuite/inline/types';
import type { Heading, Root, RootContentMap, TableRow } from 'mdast';

import {
  type Column,
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
  type SerializedCells,
} from '@blocksuite/affine-model';
import { getFilenameFromContentDisposition } from '@blocksuite/affine-shared/utils';
import { assertExists, sha } from '@blocksuite/global/utils';
import {
  type AssetsManager,
  ASTWalker,
  BaseAdapter,
  type BlockSnapshot,
  BlockSnapshotSchema,
  type DocSnapshot,
  type FromBlockSnapshotPayload,
  type FromBlockSnapshotResult,
  type FromDocSnapshotPayload,
  type FromDocSnapshotResult,
  type FromSliceSnapshotPayload,
  type FromSliceSnapshotResult,
  getAssetName,
  nanoid,
  type SliceSnapshot,
  type ToBlockSnapshotPayload,
  type ToDocSnapshotPayload,
} from '@blocksuite/store';
import { format } from 'date-fns/format';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

import { remarkGfm } from './gfm.js';
import { createText, fetchable, fetchImage, isNullish } from './utils.js';

export type Markdown = string;

type MdastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

type MarkdownAST =
  | MdastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

type MarkdownToSliceSnapshotPayload = {
  file: Markdown;
  assets?: AssetsManager;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class MarkdownAdapter extends BaseAdapter<Markdown> {
  private _traverseMarkdown = (
    markdown: MarkdownAST,
    snapshot: BlockSnapshot,
    assets?: AssetsManager
  ) => {
    const walker = new ASTWalker<MarkdownAST, BlockSnapshot>();
    walker.setONodeTypeGuard(
      (node): node is MarkdownAST =>
        !Array.isArray(node) &&
        'type' in (node as object) &&
        (node as MarkdownAST).type !== undefined
    );
    walker.setEnter(async (o, context) => {
      switch (o.node.type) {
        case 'html': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:paragraph',
                props: {
                  type: 'text',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: o.node.value,
                      },
                    ],
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'code': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:code',
                props: {
                  language: o.node.lang ?? 'Plain Text',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: o.node.value,
                      },
                    ],
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'paragraph': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:paragraph',
                props: {
                  type: 'text',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._mdastToDelta(o.node),
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'heading': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:paragraph',
                props: {
                  type: `h${o.node.depth}`,
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._mdastToDelta(o.node),
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'blockquote': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:paragraph',
                props: {
                  type: 'quote',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._mdastToDelta(o.node),
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          context.skipAllChildren();
          break;
        }
        case 'list': {
          context.setNodeContext('mdast:list:ordered', o.node.ordered);
          break;
        }
        case 'listItem': {
          context.openNode(
            {
              type: 'block',
              id: nanoid(),
              flavour: 'affine:list',
              props: {
                type:
                  o.node.checked !== null
                    ? 'todo'
                    : context.getNodeContext('mdast:list:ordered')
                      ? 'numbered'
                      : 'bulleted',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta:
                    o.node.children[0] &&
                    o.node.children[0].type === 'paragraph'
                      ? this._mdastToDelta(o.node.children[0])
                      : [],
                },
                checked: o.node.checked ?? false,
                collapsed: false,
              },
              children: [],
            },
            'children'
          );
          if (o.node.children[0] && o.node.children[0].type === 'paragraph') {
            context.skipChildren(1);
          }
          break;
        }
        case 'thematicBreak': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:divider',
                props: {},
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'image': {
          let blobId = '';
          if (!assets) {
            break;
          }
          if (!fetchable(o.node.url)) {
            const imageURLSplit = o.node.url.split('/');
            while (imageURLSplit.length > 0) {
              const key = assets
                .getPathBlobIdMap()
                .get(decodeURIComponent(imageURLSplit.join('/')));
              if (key) {
                blobId = key;
                break;
              }
              imageURLSplit.shift();
            }
          } else {
            const res = await fetchImage(
              o.node.url,
              undefined,
              this.configs.get('imageProxy') as string
            );
            if (!res) {
              break;
            }
            const clonedRes = res.clone();
            const file = new File(
              [await res.blob()],
              getFilenameFromContentDisposition(
                res.headers.get('Content-Disposition') ?? ''
              ) ??
                (o.node.url.split('/').at(-1) ?? 'image') +
                  '.' +
                  (res.headers.get('Content-Type')?.split('/').at(-1) ?? 'png'),
              {
                type: res.headers.get('Content-Type') ?? '',
              }
            );
            blobId = await sha(await clonedRes.arrayBuffer());
            assets?.getAssets().set(blobId, file);
            await assets?.writeToBlob(blobId);
          }
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:image',
                props: {
                  sourceId: blobId,
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'table': {
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
                value: createText(
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
          context.openNode(
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
          context.setNodeContext('affine:table:rowid', Object.keys(cells));
          context.skipChildren(1);
          break;
        }
        case 'tableRow': {
          context
            .openNode({
              type: 'block',
              id:
                (
                  context.getNodeContext('affine:table:rowid') as Array<string>
                ).shift() ?? nanoid(),
              flavour: 'affine:paragraph',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._mdastToDelta(o.node.children[0]),
                },
                type: 'text',
              },
              children: [],
            })
            .closeNode();
          context.skipAllChildren();
          break;
        }
        case 'math': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid(),
                flavour: 'affine:latex',
                props: {
                  latex: o.node.value as string,
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
      }
    });
    walker.setLeave((o, context) => {
      switch (o.node.type) {
        case 'listItem': {
          context.closeNode();
          break;
        }
        case 'table': {
          context.closeNode();
          break;
        }
      }
    });
    return walker.walk(markdown, snapshot);
  };

  private _traverseSnapshot = async (
    snapshot: BlockSnapshot,
    markdown: MarkdownAST,
    assets?: AssetsManager
  ) => {
    const assetsIds: string[] = [];
    const walker = new ASTWalker<BlockSnapshot, MarkdownAST>();
    walker.setONodeTypeGuard(
      (node): node is BlockSnapshot =>
        BlockSnapshotSchema.safeParse(node).success
    );
    walker.setEnter(async (o, context) => {
      const text = (o.node.props.text ?? { delta: [] }) as {
        delta: DeltaInsert[];
      };
      const currentTNode = context.currentNode();
      switch (o.node.flavour) {
        case 'affine:code': {
          context
            .openNode(
              {
                type: 'code',
                lang: (o.node.props.language as string) ?? null,
                meta: null,
                value: text.delta.map(delta => delta.insert).join(''),
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'affine:paragraph': {
          const paragraphDepth = (context.getGlobalContext(
            'affine:paragraph:depth'
          ) ?? 0) as number;
          switch (o.node.props.type) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6': {
              context
                .openNode(
                  {
                    type: 'heading',
                    depth: parseInt(o.node.props.type[1]) as Heading['depth'],
                    children: this._deltaToMdAST(text.delta, paragraphDepth),
                  },
                  'children'
                )
                .closeNode();
              break;
            }
            case 'text': {
              context
                .openNode(
                  {
                    type: 'paragraph',
                    children: this._deltaToMdAST(text.delta, paragraphDepth),
                  },
                  'children'
                )
                .closeNode();
              break;
            }
            case 'quote': {
              context
                .openNode(
                  {
                    type: 'blockquote',
                    children: [],
                  },
                  'children'
                )
                .openNode(
                  {
                    type: 'paragraph',
                    children: this._deltaToMdAST(text.delta),
                  },
                  'children'
                )
                .closeNode()
                .closeNode();
              break;
            }
          }
          context.setGlobalContext(
            'affine:paragraph:depth',
            paragraphDepth + 1
          );
          break;
        }
        case 'affine:list': {
          // check if the list is of the same type
          // if true, add the list item to the list
          // if false, create a new list
          if (
            context.getNodeContext('affine:list:parent') === o.parent &&
            currentTNode.type === 'list' &&
            currentTNode.ordered === (o.node.props.type === 'numbered') &&
            isNullish(currentTNode.children[0].checked) ===
              isNullish(
                o.node.props.type === 'todo'
                  ? (o.node.props.checked as boolean)
                  : undefined
              )
          ) {
            context
              .openNode(
                {
                  type: 'listItem',
                  checked:
                    o.node.props.type === 'todo'
                      ? (o.node.props.checked as boolean)
                      : undefined,
                  spread: false,
                  children: [],
                },
                'children'
              )
              .openNode(
                {
                  type: 'paragraph',
                  children: this._deltaToMdAST(text.delta),
                },
                'children'
              )
              .closeNode();
          } else {
            context
              .openNode(
                {
                  type: 'list',
                  ordered: o.node.props.type === 'numbered',
                  spread: false,
                  children: [],
                },
                'children'
              )
              .setNodeContext('affine:list:parent', o.parent)
              .openNode(
                {
                  type: 'listItem',
                  checked:
                    o.node.props.type === 'todo'
                      ? (o.node.props.checked as boolean)
                      : undefined,
                  spread: false,
                  children: [],
                },
                'children'
              )
              .openNode(
                {
                  type: 'paragraph',
                  children: this._deltaToMdAST(text.delta),
                },
                'children'
              )
              .closeNode();
          }
          break;
        }
        case 'affine:divider': {
          context
            .openNode(
              {
                type: 'thematicBreak',
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'affine:image': {
          const blobId = (o.node.props.sourceId ?? '') as string;
          if (!assets) {
            break;
          }
          await assets.readFromBlob(blobId);
          const blob = assets.getAssets().get(blobId);
          assetsIds.push(blobId);
          if (!blob) {
            break;
          }
          const blobName = getAssetName(assets.getAssets(), blobId);
          context
            .openNode(
              {
                type: 'paragraph',
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'image',
                url: `assets/${blobName}`,
                title: (o.node.props.caption as string | undefined) ?? null,
                alt: (blob as File).name ?? null,
              },
              'children'
            )
            .closeNode()
            .closeNode();
          break;
        }
        case 'affine:page': {
          const title = (o.node.props.title ?? { delta: [] }) as {
            delta: DeltaInsert[];
          };
          if (title.delta.length === 0) break;
          context
            .openNode(
              {
                type: 'heading',
                depth: 1,
                children: this._deltaToMdAST(title.delta, 0),
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'affine:database': {
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
                      this._deltaToMdAST(
                        (cell.value as { delta: DeltaInsert[] }).delta
                      )
                    );
                  case 'title':
                    return createAstCell(
                      this._deltaToMdAST(
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

          context
            .openNode({
              type: 'table',
              children: rows,
            })
            .closeNode();

          context.skipAllChildren();
          break;
        }
        case 'affine:embed-synced-doc': {
          const type = this.configs.get('embedSyncedDocExportType');

          // this context is used for nested sync block
          if (
            context.getGlobalContext('embed-synced-doc-counter') === undefined
          ) {
            context.setGlobalContext('embed-synced-doc-counter', 0);
          }
          let counter = context.getGlobalContext(
            'embed-synced-doc-counter'
          ) as number;
          context.setGlobalContext('embed-synced-doc-counter', ++counter);

          if (type === 'content') {
            assertExists(o.node.props.pageId);
            const syncedDocId = o.node.props.pageId as string;

            const syncedDoc = this.job.collection.getDoc(syncedDocId);
            if (!syncedDoc) break;

            if (counter === 1) {
              const syncedSnapshot = await this.job.docToSnapshot(syncedDoc);
              if (syncedSnapshot) {
                await walker.walkONode(syncedSnapshot.blocks);
              }
            } else {
              // TODO(@L-Sun) may be use the nested content
              context
                .openNode({
                  type: 'paragraph',
                  children: [
                    { type: 'text', value: syncedDoc.meta?.title ?? '' },
                  ],
                })
                .closeNode();
            }
          }

          break;
        }
        case 'affine:embed-loom':
        case 'affine:embed-github':
        case 'affine:embed-youtube':
        case 'affine:embed-figma':
        case 'affine:bookmark': {
          // Parse as link
          if (
            typeof o.node.props.title !== 'string' ||
            typeof o.node.props.url !== 'string'
          ) {
            break;
          }
          context
            .openNode(
              {
                type: 'paragraph',
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'link',
                url: o.node.props.url,
                children: [
                  {
                    type: 'text',
                    value: o.node.props.title,
                  },
                ],
              },
              'children'
            )
            .closeNode()
            .closeNode();
          break;
        }
        case 'affine:latex': {
          context
            .openNode(
              {
                type: 'math',
                value: o.node.props.latex as string,
              },
              'children'
            )
            .closeNode();
        }
      }
    });
    walker.setLeave((o, context) => {
      const currentTNode = context.currentNode();
      const previousTNode = context.previousNode();
      switch (o.node.flavour) {
        case 'affine:paragraph': {
          context.setGlobalContext(
            'affine:paragraph:depth',
            (context.getGlobalContext('affine:paragraph:depth') as number) - 1
          );
          break;
        }
        case 'affine:list': {
          if (
            context.getPreviousNodeContext('affine:list:parent') === o.parent &&
            currentTNode.type === 'listItem' &&
            previousTNode?.type === 'list' &&
            previousTNode.ordered === (o.node.props.type === 'numbered') &&
            isNullish(currentTNode.checked) ===
              isNullish(
                o.node.props.type === 'todo'
                  ? (o.node.props.checked as boolean)
                  : undefined
              )
          ) {
            context.closeNode();
            if (o.next?.flavour !== 'affine:list') {
              // If the next node is not a list, close the list
              context.closeNode();
            }
          } else {
            context.closeNode().closeNode();
          }
          break;
        }
        case 'affine:embed-synced-doc': {
          const counter = context.getGlobalContext(
            'embed-synced-doc-counter'
          ) as number;
          context.setGlobalContext('embed-synced-doc-counter', counter - 1);
          break;
        }
      }
    });
    return {
      ast: (await walker.walk(snapshot, markdown)) as Root,
      assetsIds,
    };
  };

  private _astToMarkdown(ast: Root) {
    return unified()
      .use(remarkGfm)
      .use(remarkStringify, {
        resourceLink: true,
      })
      .use(remarkMath)
      .stringify(ast)
      .replace(/&#x20;\n/g, ' \n');
  }

  private _deltaToMdAST(
    deltas: DeltaInsert<AffineTextAttributes>[],
    depth = 0
  ) {
    if (depth > 0) {
      deltas.unshift({ insert: ' '.repeat(4).repeat(depth) });
    }
    return deltas.map(delta => {
      let mdast: MarkdownAST = {
        type: 'text',
        value: delta.attributes?.underline
          ? `<u>${delta.insert}</u>`
          : delta.insert,
      };
      if (delta.attributes?.reference) {
        const title = this.configs.get(
          'title:' + delta.attributes.reference.pageId
        );
        if (typeof title === 'string') {
          mdast = {
            type: 'text',
            value: title,
          };
        }
      }
      if (delta.attributes?.code) {
        mdast = {
          type: 'inlineCode',
          value: delta.insert,
        };
      }
      if (delta.attributes?.bold) {
        mdast = {
          type: 'strong',
          children: [mdast],
        };
      }
      if (delta.attributes?.italic) {
        mdast = {
          type: 'emphasis',
          children: [mdast],
        };
      }
      if (delta.attributes?.strike) {
        mdast = {
          type: 'delete',
          children: [mdast],
        };
      }
      if (delta.attributes?.link) {
        if (delta.insert === '') {
          mdast = {
            type: 'text',
            value: delta.attributes.link,
          };
        } else if (delta.insert !== delta.attributes.link) {
          mdast = {
            type: 'link',
            url: delta.attributes.link,
            children: [mdast],
          };
        }
      }
      if (delta.attributes?.latex) {
        mdast = {
          type: 'inlineMath',
          value: delta.attributes.latex as string,
        };
      }
      return mdast;
    });
  }

  private _markdownToAst(markdown: Markdown) {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .parse(markdown);
  }

  private _mdastToDelta(ast: MarkdownAST): DeltaInsert<AffineTextAttributes>[] {
    switch (ast.type) {
      case 'text': {
        return [{ insert: ast.value }];
      }
      case 'inlineCode': {
        return [{ insert: ast.value, attributes: { code: true } }];
      }
      case 'strong': {
        return ast.children.flatMap(child =>
          this._mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, bold: true };
            return delta;
          })
        );
      }
      case 'emphasis': {
        return ast.children.flatMap(child =>
          this._mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, italic: true };
            return delta;
          })
        );
      }
      case 'delete': {
        return ast.children.flatMap(child =>
          this._mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, strike: true };
            return delta;
          })
        );
      }
      case 'link': {
        return ast.children.flatMap(child =>
          this._mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, link: ast.url };
            return delta;
          })
        );
      }
      case 'list': {
        return [];
      }
      case 'inlineMath': {
        return [{ insert: ' ', attributes: { latex: ast.value } }];
      }
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._mdastToDelta(child))
      : [];
  }

  async fromBlockSnapshot({
    snapshot,
    assets,
  }: FromBlockSnapshotPayload): Promise<FromBlockSnapshotResult<Markdown>> {
    const root: Root = {
      type: 'root',
      children: [],
    };
    const { ast, assetsIds } = await this._traverseSnapshot(
      snapshot,
      root,
      assets
    );
    return {
      file: this._astToMarkdown(ast),
      assetsIds,
    };
  }

  async fromDocSnapshot({
    snapshot,
    assets,
  }: FromDocSnapshotPayload): Promise<FromDocSnapshotResult<Markdown>> {
    let buffer = '';
    const { file, assetsIds } = await this.fromBlockSnapshot({
      snapshot: snapshot.blocks,
      assets,
    });
    buffer += file;
    return {
      file: buffer,
      assetsIds,
    };
  }

  async fromSliceSnapshot({
    snapshot,
    assets,
  }: FromSliceSnapshotPayload): Promise<FromSliceSnapshotResult<Markdown>> {
    let buffer = '';
    const sliceAssetsIds: string[] = [];
    for (const contentSlice of snapshot.content) {
      const root: Root = {
        type: 'root',
        children: [],
      };
      const { ast, assetsIds } = await this._traverseSnapshot(
        contentSlice,
        root,
        assets
      );
      sliceAssetsIds.push(...assetsIds);
      buffer += this._astToMarkdown(ast);
    }
    const markdown =
      buffer.match(/\n/g)?.length === 1 ? buffer.trimEnd() : buffer;
    return {
      file: markdown,
      assetsIds: sliceAssetsIds,
    };
  }

  async toBlockSnapshot(
    payload: ToBlockSnapshotPayload<Markdown>
  ): Promise<BlockSnapshot> {
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [],
    };
    return this._traverseMarkdown(
      markdownAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets
    );
  }

  async toDocSnapshot(
    payload: ToDocSnapshotPayload<Markdown>
  ): Promise<DocSnapshot> {
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [],
    };
    return {
      type: 'page',
      meta: {
        id: nanoid(),
        title: 'Untitled',
        createDate: Date.now(),
        tags: [],
      },
      blocks: {
        type: 'block',
        id: nanoid(),
        flavour: 'affine:page',
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: [
              {
                insert: 'Untitled',
              },
            ],
          },
        },
        children: [
          {
            type: 'block',
            id: nanoid(),
            flavour: 'affine:surface',
            props: {
              elements: {},
            },
            children: [],
          },
          await this._traverseMarkdown(
            markdownAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets
          ),
        ],
      },
    };
  }

  async toSliceSnapshot(
    payload: MarkdownToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    let codeFence = '';
    payload.file = payload.file
      .split('\n')
      .map(line => {
        if (line.trimStart().startsWith('-')) {
          return line;
        }
        let trimmedLine = line.trimStart();
        if (!codeFence && trimmedLine.startsWith('```')) {
          codeFence = trimmedLine.substring(
            0,
            trimmedLine.lastIndexOf('```') + 3
          );
          if (codeFence.split('').every(c => c === '`')) {
            return line;
          }
          codeFence = '';
        }
        if (!codeFence && trimmedLine.startsWith('~~~')) {
          codeFence = trimmedLine.substring(
            0,
            trimmedLine.lastIndexOf('~~~') + 3
          );
          if (codeFence.split('').every(c => c === '~')) {
            return line;
          }
          codeFence = '';
        }
        if (
          !!codeFence &&
          trimmedLine.startsWith(codeFence) &&
          trimmedLine.lastIndexOf(codeFence) === 0
        ) {
          codeFence = '';
        }
        if (codeFence) {
          return line;
        }

        trimmedLine = trimmedLine.trimEnd();
        if (!trimmedLine.startsWith('<') && !trimmedLine.endsWith('>')) {
          // check if it is a url link and wrap it with the angle brackets
          // sometimes the url includes emphasis `_` that will break URL parsing
          //
          // eg. /MuawcBMT1Mzvoar09-_66?mode=page&blockIds=rL2_GXbtLU2SsJVfCSmh_
          // https://www.markdownguide.org/basic-syntax/#urls-and-email-addresses
          try {
            const valid =
              URL.canParse?.(trimmedLine) ?? Boolean(new URL(trimmedLine));
            if (valid) {
              return `<${trimmedLine}>`;
            }
          } catch (err) {
            console.log(err);
          }
        }

        return line.replace(/^ /, '&#x20;');
      })
      .join('\n');
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: DEFAULT_NOTE_BACKGROUND_COLOR,
        index: 'a0',
        hidden: false,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      children: [],
    };
    const contentSlice = (await this._traverseMarkdown(
      markdownAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets
    )) as BlockSnapshot;
    if (contentSlice.children.length === 0) {
      return null;
    }
    return {
      type: 'slice',
      content: [contentSlice],
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    };
  }
}
