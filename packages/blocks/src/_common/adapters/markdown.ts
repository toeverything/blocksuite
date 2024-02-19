import type { DeltaInsert } from '@blocksuite/inline/types';
import type {
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromPageSnapshotPayload,
  FromPageSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
  ToBlockSnapshotPayload,
  ToPageSnapshotPayload,
} from '@blocksuite/store';
import { type AssetsManager, getAssetName } from '@blocksuite/store';
import {
  type BlockSnapshot,
  BlockSnapshotSchema,
  type PageSnapshot,
  type SliceSnapshot,
} from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';
import { ASTWalker, BaseAdapter } from '@blocksuite/store';
import { sha } from '@blocksuite/store';
import { format } from 'date-fns/format';
import type { Heading, Root, RootContentMap, TableRow } from 'mdast';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

import type { SerializedCells } from '../../database-block/database-model.js';
import type { Column } from '../../database-block/types.js';
import { NoteDisplayMode } from '../types.js';
import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import { remarkGfm } from './gfm.js';
import { fetchImage } from './utils.js';

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
  async fromPageSnapshot({
    snapshot,
    assets,
  }: FromPageSnapshotPayload): Promise<FromPageSnapshotResult<Markdown>> {
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

  async toPageSnapshot(
    payload: ToPageSnapshotPayload<Markdown>
  ): Promise<PageSnapshot> {
    const markdownAst = this._markdownToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-background-secondary-color',
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
        createDate: +new Date(),
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
        background: '--affine-background-secondary-color',
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

  async toSliceSnapshot(
    payload: MarkdownToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    payload.file = payload.file
      .split('\n')
      .map(line => {
        if (line.trimStart().startsWith('-')) {
          return line;
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
        background: '--affine-background-secondary-color',
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
            currentTNode.children[0].checked ===
              (o.node.props.type === 'todo'
                ? (o.node.props.checked as boolean)
                : undefined)
          ) {
            context
              .openNode(
                {
                  type: 'listItem',
                  checked:
                    o.node.props.type === 'todo'
                      ? (o.node.props.checked as boolean)
                      : undefined,
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
          const blobName = getAssetName(assets.getAssets(), blobId);
          if (!blob) {
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
                type: 'image',
                url: `assets/${blobName}`,
                title: null,
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
          const createAstCell = (
            children: Record<string, string | undefined | unknown>[]
          ) => ({
            type: 'tableCell',
            children,
          });
          const mdAstCells = Array.prototype.map.call(
            children,
            (v: BlockSnapshot) =>
              Array.prototype.map.call(columns, col => {
                const cell = cells[v.id]?.[col.id];
                let r;
                if (cell || col.type === 'title') {
                  switch (col.type) {
                    case 'link':
                    case 'progress':
                    case 'number':
                      r = createAstCell([
                        {
                          type: 'text',
                          value: cell.value,
                        },
                      ]);
                      break;
                    case 'rich-text':
                      r = createAstCell([
                        {
                          type: 'text',
                          value: (cell.value as { delta: DeltaInsert[] }).delta
                            .map(v => v.insert)
                            .join(),
                        },
                      ]);
                      break;
                    case 'title':
                      r = createAstCell([
                        {
                          type: 'text',
                          value: (
                            v.props.text as { delta: DeltaInsert[] }
                          ).delta
                            .map(v => v.insert)
                            .join(''),
                        },
                      ]);
                      break;
                    case 'date':
                      r = createAstCell([
                        {
                          type: 'text',
                          value: format(
                            new Date(cell.value as number),
                            'yyyy-MM-dd'
                          ),
                        },
                      ]);
                      break;
                    case 'select': {
                      const value = col.data.options.find(
                        (opt: Record<string, string>) => opt.id === cell.value
                      )?.value;
                      r = createAstCell([{ type: 'text', value }]);
                      break;
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
                      r = createAstCell([{ type: 'text', value }]);
                      break;
                    }
                    case 'checkbox': {
                      r = createAstCell([{ type: 'text', value: cell.value }]);
                      break;
                    }
                    default:
                      r = createAstCell([{ type: 'text', value: '' }]);
                  }
                } else {
                  r = createAstCell([{ type: 'text', value: '' }]);
                }
                return r;
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
            previousTNode.children[0]?.checked ===
              (o.node.props.type === 'todo'
                ? (o.node.props.checked as boolean)
                : undefined)
          ) {
            context.closeNode();
            const nextONode = o.parent!.children[o.index! + 1];
            if (
              !nextONode ||
              (nextONode && nextONode.flavour !== 'affine:list')
            ) {
              // If the next node is not a list, close the list
              context.closeNode();
            }
          } else {
            context.closeNode().closeNode();
          }
          break;
        }
      }
    });
    return {
      ast: (await walker.walk(snapshot, markdown)) as Root,
      assetsIds,
    };
  };

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
          if (!o.node.url.startsWith('http')) {
            const imageURL = o.node.url;
            assets.getAssets().forEach((_value, key) => {
              if (imageURL.includes(getAssetName(assets.getAssets(), key))) {
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
                o.node.url.split('/').at(-1) ??
                'image' + res.headers.get('Content-Type')?.split('/').at(-1) ??
                '.png'
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
                value: cell.children
                  .map(child => ('value' in child ? child.value : ''))
                  .join(''),
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

  private _astToMarkdown(ast: Root) {
    return unified()
      .use(remarkGfm)
      .use(remarkStringify, {
        resourceLink: true,
      })
      .stringify(ast)
      .replace(/&#x20;\n/g, ' \n');
  }

  private _markdownToAst(markdown: Markdown) {
    return unified().use(remarkParse).use(remarkGfm).parse(markdown);
  }

  private _deltaToMdAST(deltas: DeltaInsert[], depth = 0) {
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
      return mdast;
    });
  }

  private _mdastToDelta(ast: MarkdownAST): DeltaInsert[] {
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
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._mdastToDelta(child))
      : [];
  }
}
