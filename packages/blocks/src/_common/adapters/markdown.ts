import type { DeltaInsert } from '@blocksuite/inline/types';
import type {
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromDocSnapshotPayload,
  FromDocSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
  ToBlockSnapshotPayload,
  ToDocSnapshotPayload,
} from '@blocksuite/store';
import type { Heading, Root, RootContentMap, TableRow } from 'mdast';

import { assertExists, sha } from '@blocksuite/global/utils';
import {
  ASTWalker,
  type AssetsManager,
  BaseAdapter,
  type BlockSnapshot,
  BlockSnapshotSchema,
  type DocSnapshot,
  type SliceSnapshot,
  getAssetName,
  nanoid,
} from '@blocksuite/store';
import { format } from 'date-fns/format';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

import type { SerializedCells } from '../../database-block/database-model.js';
import type { Column } from '../../database-block/types.js';
import type { AffineTextAttributes } from '../inline/presets/affine-inline-specs.js';

import { NoteDisplayMode } from '../types.js';
import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import { remarkGfm } from './gfm.js';
import { createText, fetchImage, fetchable, isNullish } from './utils.js';

export type Markdown = string;

type MdastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

type MarkdownAST =
  | MdastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

type MarkdownToSliceSnapshotPayload = {
  assets?: AssetsManager;
  file: Markdown;
  pageId: string;
  pageVersion: number;
  workspaceId: string;
  workspaceVersion: number;
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
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: o.node.value,
                      },
                    ],
                  },
                  type: 'text',
                },
                type: 'block',
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
                children: [],
                flavour: 'affine:code',
                id: nanoid(),
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
                type: 'block',
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
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._mdastToDelta(o.node),
                  },
                  type: 'text',
                },
                type: 'block',
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
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._mdastToDelta(o.node),
                  },
                  type: `h${o.node.depth}`,
                },
                type: 'block',
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
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._mdastToDelta(o.node),
                  },
                  type: 'quote',
                },
                type: 'block',
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
              children: [],
              flavour: 'affine:list',
              id: nanoid(),
              props: {
                checked: o.node.checked ?? false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta:
                    o.node.children[0] &&
                    o.node.children[0].type === 'paragraph'
                      ? this._mdastToDelta(o.node.children[0])
                      : [],
                },
                type:
                  o.node.checked !== null
                    ? 'todo'
                    : context.getNodeContext('mdast:list:ordered')
                      ? 'numbered'
                      : 'bulleted',
              },
              type: 'block',
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
                children: [],
                flavour: 'affine:divider',
                id: nanoid(),
                props: {},
                type: 'block',
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
            const imageURL = o.node.url;
            assets.getAssets().forEach((_value, key) => {
              const imageName = getAssetName(assets.getAssets(), key);
              if (decodeURIComponent(imageURL).includes(imageName)) {
                blobId = key;
              }
            });
          } else {
            const res = await fetchImage(
              o.node.url,
              undefined,
              this.configs.get('imageProxy') as string
            );
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
                children: [],
                flavour: 'affine:image',
                id: nanoid(),
                props: {
                  sourceId: blobId,
                },
                type: 'block',
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'table': {
          const viewsColumns = o.node.children[0].children.map(() => {
            return {
              hide: false,
              id: nanoid(),
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
              data: {},
              id: viewsColumns[index].id,
              name: _child.children
                .map(child => ('value' in child ? child.value : ''))
                .join(''),
              type: index === 0 ? 'title' : 'rich-text',
            };
          });
          context.openNode(
            {
              children: [],
              flavour: 'affine:database',
              id: nanoid(),
              props: {
                cells,
                columns,
                title: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                views: [
                  {
                    columns: [],
                    filter: {
                      conditions: [],
                      op: 'and',
                      type: 'group',
                    },
                    header: {
                      iconColumn: 'type',
                      titleColumn: viewsColumns[0]?.id,
                    },
                    id: nanoid(),
                    mode: 'table',
                    name: 'Table View',
                  },
                ],
              },
              type: 'block',
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
              children: [],
              flavour: 'affine:paragraph',
              id:
                (
                  context.getNodeContext('affine:table:rowid') as Array<string>
                ).shift() ?? nanoid(),
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._mdastToDelta(o.node.children[0]),
                },
                type: 'text',
              },
              type: 'block',
            })
            .closeNode();
          context.skipAllChildren();
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
                lang: (o.node.props.language as string) ?? null,
                meta: null,
                type: 'code',
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
                    children: this._deltaToMdAST(text.delta, paragraphDepth),
                    depth: parseInt(o.node.props.type[1]) as Heading['depth'],
                    type: 'heading',
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
                    children: this._deltaToMdAST(text.delta, paragraphDepth),
                    type: 'paragraph',
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
                    children: [],
                    type: 'blockquote',
                  },
                  'children'
                )
                .openNode(
                  {
                    children: this._deltaToMdAST(text.delta),
                    type: 'paragraph',
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
                  checked:
                    o.node.props.type === 'todo'
                      ? (o.node.props.checked as boolean)
                      : undefined,
                  children: [],
                  spread: false,
                  type: 'listItem',
                },
                'children'
              )
              .openNode(
                {
                  children: this._deltaToMdAST(text.delta),
                  type: 'paragraph',
                },
                'children'
              )
              .closeNode();
          } else {
            context
              .openNode(
                {
                  children: [],
                  ordered: o.node.props.type === 'numbered',
                  spread: false,
                  type: 'list',
                },
                'children'
              )
              .setNodeContext('affine:list:parent', o.parent)
              .openNode(
                {
                  checked:
                    o.node.props.type === 'todo'
                      ? (o.node.props.checked as boolean)
                      : undefined,
                  children: [],
                  spread: false,
                  type: 'listItem',
                },
                'children'
              )
              .openNode(
                {
                  children: this._deltaToMdAST(text.delta),
                  type: 'paragraph',
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
          const blobName = getAssetName(assets.getAssets(), blobId);
          if (!blob) {
            break;
          }
          context
            .openNode(
              {
                children: [],
                type: 'paragraph',
              },
              'children'
            )
            .openNode(
              {
                alt: (blob as File).name ?? null,
                title: (o.node.props.caption as string | undefined) ?? null,
                type: 'image',
                url: `assets/${blobName}`,
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
                children: this._deltaToMdAST(title.delta, 0),
                depth: 1,
                type: 'heading',
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
            children,
            type: 'tableCell',
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
              children: Array.prototype.map.call(columns, v =>
                createAstCell([
                  {
                    type: 'text',
                    value: v.name,
                  },
                ])
              ) as [],
              type: 'tableRow',
            });
          }

          // Handle 2-... rows
          Array.prototype.forEach.call(mdAstCells, children => {
            rows.push({ children, type: 'tableRow' });
          });

          context
            .openNode({
              children: rows,
              type: 'table',
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
              await walker.walkONode(syncedSnapshot.blocks);
            } else {
              // TODO(@L-Sun) may be use the nested content
              context
                .openNode({
                  children: [
                    { type: 'text', value: syncedDoc.meta?.title ?? '' },
                  ],
                  type: 'paragraph',
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
                children: [],
                type: 'paragraph',
              },
              'children'
            )
            .openNode(
              {
                children: [
                  {
                    type: 'text',
                    value: o.node.props.title,
                  },
                ],
                type: 'link',
                url: o.node.props.url,
              },
              'children'
            )
            .closeNode()
            .closeNode();
          break;
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
      assetsIds,
      ast: (await walker.walk(snapshot, markdown)) as Root,
    };
  };

  private _astToMarkdown(ast: Root) {
    return unified()
      .use(remarkGfm)
      .use(remarkStringify, {
        resourceLink: true,
      })
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
          children: [mdast],
          type: 'strong',
        };
      }
      if (delta.attributes?.italic) {
        mdast = {
          children: [mdast],
          type: 'emphasis',
        };
      }
      if (delta.attributes?.strike) {
        mdast = {
          children: [mdast],
          type: 'delete',
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
            children: [mdast],
            type: 'link',
            url: delta.attributes.link,
          };
        }
      }
      return mdast;
    });
  }

  private _markdownToAst(markdown: Markdown) {
    return unified().use(remarkParse).use(remarkGfm).parse(markdown);
  }

  private _mdastToDelta(ast: MarkdownAST): DeltaInsert[] {
    switch (ast.type) {
      case 'text': {
        return [{ insert: ast.value }];
      }
      case 'inlineCode': {
        return [{ attributes: { code: true }, insert: ast.value }];
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
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._mdastToDelta(child))
      : [];
  }

  async fromBlockSnapshot({
    assets,
    snapshot,
  }: FromBlockSnapshotPayload): Promise<FromBlockSnapshotResult<Markdown>> {
    const root: Root = {
      children: [],
      type: 'root',
    };
    const { assetsIds, ast } = await this._traverseSnapshot(
      snapshot,
      root,
      assets
    );
    return {
      assetsIds,
      file: this._astToMarkdown(ast),
    };
  }

  async fromDocSnapshot({
    assets,
    snapshot,
  }: FromDocSnapshotPayload): Promise<FromDocSnapshotResult<Markdown>> {
    let buffer = '';
    const { assetsIds, file } = await this.fromBlockSnapshot({
      assets,
      snapshot: snapshot.blocks,
    });
    buffer += file;
    return {
      assetsIds,
      file: buffer,
    };
  }

  async fromSliceSnapshot({
    assets,
    snapshot,
  }: FromSliceSnapshotPayload): Promise<FromSliceSnapshotResult<Markdown>> {
    let buffer = '';
    const sliceAssetsIds: string[] = [];
    for (const contentSlice of snapshot.content) {
      const root: Root = {
        children: [],
        type: 'root',
      };
      const { assetsIds, ast } = await this._traverseSnapshot(
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
      assetsIds: sliceAssetsIds,
      file: markdown,
    };
  }

  async toBlockSnapshot(
    payload: ToBlockSnapshotPayload<Markdown>
  ): Promise<BlockSnapshot> {
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      children: [],
      flavour: 'affine:note',
      id: nanoid(),
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
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
      children: [],
      flavour: 'affine:note',
      id: nanoid(),
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };
    return {
      blocks: {
        children: [
          {
            children: [],
            flavour: 'affine:surface',
            id: nanoid(),
            props: {
              elements: {},
            },
            type: 'block',
          },
          await this._traverseMarkdown(
            markdownAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets
          ),
        ],
        flavour: 'affine:page',
        id: nanoid(),
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
        type: 'block',
      },
      meta: {
        createDate: Date.now(),
        id: nanoid(),
        tags: [],
        title: 'Untitled',
      },
      type: 'page',
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
        const trimmedLine = line.trimStart();
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
        return line.replace(/^ /, '&#x20;');
      })
      .join('\n');
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      children: [],
      flavour: 'affine:note',
      id: nanoid(),
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
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
      content: [contentSlice],
      pageId: payload.pageId,
      pageVersion: payload.pageVersion,
      type: 'slice',
      workspaceId: payload.workspaceId,
      workspaceVersion: payload.workspaceVersion,
    };
  }
}
