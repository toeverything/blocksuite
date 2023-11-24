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
import { type AssetsManager, getAssetName, sha } from '@blocksuite/store';
import { ASTWalker, BaseAdapter } from '@blocksuite/store';
import {
  type BlockSnapshot,
  type PageSnapshot,
  type SliceSnapshot,
} from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';
import type { DeltaInsert } from '@blocksuite/virgo';
import rehypeParse from 'rehype-parse';
import { unified } from 'unified';

import { getTagColor } from '../components/tags/colors.js';
import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import {
  hastGetElementChildren,
  hastGetTextChildrenOnlyAst,
  hastGetTextContent,
  hastQuerySelector,
  type HtmlAST,
} from './hast.js';

export type NotionHtml = string;

type NotionHtmlToSliceSnapshotPayload = {
  file: NotionHtml;
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

const ColumnClassMap: Record<string, string> = {
  typesSelect: 'select',
  typesMultipleSelect: 'multi-select',
  typesNumber: 'number',
  typesCheckbox: 'checkbox',
  typesText: 'rich-text',
  typesTitle: 'title',
};

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

type BlocksuiteTableRow = {
  [key: string]: {
    columnId: string;
    value: unknown;
  };
};

export class NotionHtmlAdapter extends BaseAdapter<NotionHtml> {
  override fromPageSnapshot(
    _payload: FromPageSnapshotPayload
  ): Promise<FromPageSnapshotResult<string>> {
    throw new Error('Method not implemented.');
  }
  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    throw new Error('Method not implemented.');
  }
  override fromSliceSnapshot(
    _payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    throw new Error('Method not implemented.');
  }
  override async toPageSnapshot(
    payload: ToPageSnapshotPayload<string>
  ): Promise<PageSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid('block'),
      flavour: 'affine:note',
      props: {},
      children: [],
    };
    return {
      type: 'page',
      meta: {
        id: nanoid('page'),
        title: hastGetTextContent(
          hastQuerySelector(notionHtmlAst, 'title'),
          'Untitled'
        ),
        createDate: +new Date(),
        tags: [],
      },
      blocks: await this._traverseNotionHtml(
        notionHtmlAst,
        blockSnapshotRoot as BlockSnapshot,
        payload.assets
      ),
    };
  }
  override toBlockSnapshot(
    payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid('block'),
      flavour: 'affine:note',
      props: {},
      children: [],
    };
    return this._traverseNotionHtml(
      notionHtmlAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets
    );
  }
  override async toSliceSnapshot(
    payload: NotionHtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
    const blockSnapshotRoot = {
      type: 'block',
      id: nanoid('block'),
      flavour: 'affine:note',
      props: {},
      children: [],
    };
    return {
      type: 'slice',
      content: [
        await this._traverseNotionHtml(
          notionHtmlAst,
          blockSnapshotRoot as BlockSnapshot,
          payload.assets
        ),
      ],
      blockVersions: payload.blockVersions,
      pageVersion: payload.pageVersion,
      workspaceVersion: payload.workspaceVersion,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
    };
  }

  private _htmlToAst(notionHtml: NotionHtml) {
    return unified().use(rehypeParse).parse(notionHtml);
  }

  private _traverseNotionHtml = async (
    html: HtmlAST,
    snapshot: BlockSnapshot,
    assets?: AssetsManager
  ) => {
    const walker = new ASTWalker<HtmlAST, BlockSnapshot>();
    walker.setONodeTypeGuard(
      (node): node is HtmlAST =>
        'type' in (node as object) && (node as HtmlAST).type !== undefined
    );
    walker.setEnter(async (o, context) => {
      if (o.node.type !== 'element') {
        return;
      }
      switch (o.node.tagName) {
        case 'header': {
          context.skipAllChildren();
          break;
        }
        case 'pre': {
          const code = hastQuerySelector(o.node, 'code');
          if (!code) {
            break;
          }
          const codeText =
            code.children.length === 1 && code.children[0].type === 'text'
              ? code.children[0]
              : code;
          context
            .openNode(
              {
                type: 'block',
                id: nanoid('block'),
                flavour: 'affine:code',
                props: {
                  language: null,
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(codeText, { trim: false }),
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
        case 'blockquote': {
          context.setGlobalContext('hast:blockquote', true);
          context
            .openNode(
              {
                type: 'block',
                id: nanoid('block'),
                flavour: 'affine:paragraph',
                props: {
                  type: 'quote',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(
                      hastGetTextChildrenOnlyAst(o.node)
                    ),
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'p': {
          // Workaround for Notion's bug
          // https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element
          if (!o.node.properties.id) {
            break;
          }
          context.openNode(
            {
              type: 'block',
              id: nanoid('block'),
              flavour: 'affine:paragraph',
              props: {
                type: context.getGlobalContext('hast:blockquote')
                  ? 'quote'
                  : 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._hastToDelta(o.node),
                },
              },
              children: [],
            },
            'children'
          );
          break;
        }
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid('block'),
                flavour: 'affine:heading',
                props: {
                  type: o.node.tagName,
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(o.node),
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'ul':
        case 'ol': {
          context.setNodeContext('hast:list:type', 'bulleted');
          if (o.node.tagName === 'ol') {
            context.setNodeContext('hast:list:type', 'numbered');
          } else if (Array.isArray(o.node.properties?.className)) {
            if (o.node.properties.className.includes('to-do-list')) {
              context.setNodeContext('hast:list:type', 'todo');
            } else if (o.node.properties.className.includes('toggle')) {
              context.setNodeContext('hast:list:type', 'toggle');
            } else if (o.node.properties.className.includes('bulleted-list')) {
              context.setNodeContext('hast:list:type', 'bulleted');
            }
          }
          break;
        }
        case 'li': {
          const firstElementChild = hastGetElementChildren(o.node)[0];
          const listType = context.getNodeContext('hast:list:type');
          context.openNode(
            {
              type: 'block',
              id: nanoid('block'),
              flavour: 'affine:list',
              props: {
                type: listType,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta:
                    listType !== 'toggle'
                      ? this._hastToDelta(o.node)
                      : this._hastToDelta(
                          hastQuerySelector(o.node, 'summary') ?? o.node
                        ),
                },
                checked:
                  listType === 'todo'
                    ? firstElementChild &&
                      Array.isArray(firstElementChild.properties?.className) &&
                      firstElementChild.properties.className.includes(
                        'checkbox-on'
                      )
                    : false,
                collapsed:
                  listType === 'toggle'
                    ? firstElementChild &&
                      firstElementChild.tagName === 'details' &&
                      firstElementChild.properties.open === undefined
                    : false,
              },
              children: [],
            },
            'children'
          );
          break;
        }
        case 'hr': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid('block'),
                flavour: 'affine:divider',
                props: {},
                children: [],
              },
              'children'
            )
            .closeNode();
          break;
        }
        case 'figure': {
          // Notion page link
          if (hastQuerySelector(o.node, '.link-to-page')) {
            context
              .openNode(
                {
                  type: 'block',
                  id: nanoid('block'),
                  flavour: 'affine:paragraph',
                  props: {
                    type: 'text',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: this._hastToDelta(o.node),
                    },
                  },
                  children: [],
                },
                'children'
              )
              .closeNode();
            break;
          }
          // Notion callout
          if (hastQuerySelector(o.node, '.callout')) {
            context
              .openNode(
                {
                  type: 'block',
                  id: nanoid('block'),
                  flavour: 'affine:paragraph',
                  props: {
                    type: 'text',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: this._hastToDelta(o.node),
                    },
                  },
                  children: [],
                },
                'children'
              )
              .closeNode();
            break;
          }
          // Notion bookmark
          const bookmark = hastQuerySelector(o.node, '.bookmark');
          if (bookmark) {
            const bookmarkURL = bookmark.properties?.href;
            const bookmarkTitle = hastGetTextContent(
              hastQuerySelector(bookmark, '.bookmark-title')
            );
            const bookmarkDescription = hastGetTextContent(
              hastQuerySelector(bookmark, '.bookmark-description')
            );
            const bookmarkIcon = hastQuerySelector(bookmark, '.bookmark-icon');
            const bookmarkIconURL =
              typeof bookmarkIcon?.properties?.src === 'string'
                ? bookmarkIcon.properties.src
                : '';
            context
              .openNode(
                {
                  type: 'block',
                  id: nanoid('block'),
                  flavour: 'affine:bookmark',
                  props: {
                    type: 'card',
                    url: bookmarkURL ?? '',
                    bookmarkTitle,
                    description: bookmarkDescription,
                    icon: bookmarkIconURL,
                  },
                  children: [],
                },
                'children'
              )
              .closeNode();
          }
          if (!assets) {
            break;
          }
          // Notion image
          const imageFigureWrapper = hastQuerySelector(o.node, '.image');
          let imageURL = '';
          if (imageFigureWrapper) {
            const image = hastQuerySelector(imageFigureWrapper, 'img');
            imageURL =
              typeof image?.properties.src === 'string'
                ? image.properties.src
                : '';
          }
          if (imageURL) {
            let blobId = '';
            if (!imageURL.startsWith('http')) {
              assets.getAssets().forEach((_value, key) => {
                const attachmentName = getAssetName(assets.getAssets(), key);
                if (imageURL.includes(attachmentName)) {
                  blobId = key;
                }
              });
            } else {
              const res = await fetch(imageURL);
              const clonedRes = res.clone();
              const name =
                getFilenameFromContentDisposition(
                  res.headers.get('Content-Disposition') ?? ''
                ) ??
                imageURL.split('/').at(-1) ??
                'image' + res.headers.get('Content-Type')?.split('/').at(-1) ??
                '.png';
              const file = new File([await res.blob()], name);
              blobId = await sha(await clonedRes.arrayBuffer());
              assets?.getAssets().set(blobId, file);
              assets?.writeToBlob(blobId);
            }
            context
              .openNode(
                {
                  type: 'block',
                  id: nanoid('block'),
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
          // Notion embeded
          const embededFigureWrapper = hastQuerySelector(o.node, '.source');
          let embededURL = '';
          if (embededFigureWrapper) {
            const embedA = hastQuerySelector(embededFigureWrapper, 'a');
            embededURL =
              typeof embedA?.properties.href === 'string'
                ? embedA.properties.href
                : '';
          }
          if (embededURL) {
            let blobId = '';
            let name = '';
            let type = '';
            let size = 0;
            if (!embededURL.startsWith('http')) {
              assets.getAssets().forEach((value, key) => {
                const embededName = getAssetName(assets.getAssets(), key);
                if (embededURL.includes(embededName)) {
                  blobId = key;
                  name = embededName;
                  size = value.size;
                  type = value.type;
                }
              });
            } else {
              const res = await fetch(embededURL);
              const resCloned = res.clone();
              name =
                getFilenameFromContentDisposition(
                  res.headers.get('Content-Disposition') ?? ''
                ) ??
                embededURL.split('/').at(-1) ??
                'file' + res.headers.get('Content-Type')?.split('/').at(-1) ??
                '.blob';
              const file = new File([await res.blob()], name);
              size = file.size;
              type = file.type;
              blobId = await sha(await resCloned.arrayBuffer());
              assets?.getAssets().set(blobId, file);
              assets?.writeToBlob(blobId);
            }
            context
              .openNode(
                {
                  type: 'block',
                  id: nanoid('block'),
                  flavour: 'affine:attachment',
                  props: {
                    name,
                    size,
                    type,
                    sourceId: blobId,
                  },
                  children: [],
                },
                'children'
              )
              .closeNode();
            break;
          }
          break;
        }
        case 'th': {
          const columnId = nanoid('unknown');
          const columnTypeClass = hastQuerySelector(o.node, 'svg')?.properties
            ?.className;
          const columnType = Array.isArray(columnTypeClass)
            ? ColumnClassMap[columnTypeClass[0]] ?? 'rich-text'
            : 'rich-text';
          context.pushGlobalContextStack<BlocksuiteTableColumn>(
            'hast:table:column',
            {
              type: columnType,
              name: hastGetTextContent(hastGetTextChildrenOnlyAst(o.node)),
              data: Object.create(null),
              id: columnId,
            }
          );
          break;
        }
        case 'tr': {
          if (o.parent?.type === 'element' && o.parent.tagName === 'tbody') {
            const columns =
              context.getGlobalContextStack<BlocksuiteTableColumn>(
                'hast:table:column'
              );
            const row = Object.create(null);
            hastGetElementChildren(o.node).forEach((child, index) => {
              if (hastQuerySelector(child, '.cell-title')) {
                context.pushGlobalContextStack<BlockSnapshot>(
                  'hast:table:children',
                  {
                    type: 'block',
                    id: nanoid('block'),
                    flavour: 'affine:paragraph',
                    props: {
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: this._hastToDelta(child),
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
              if (hastQuerySelector(child, '.selected-value')) {
                if (!('options' in columns[index].data)) {
                  columns[index].data.options = [];
                }
                if (!['select', 'multi-select'].includes(columns[index].type)) {
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
                      option => option.value === hastGetTextContent(span)
                    );
                    const id = filteredArray?.length
                      ? filteredArray[0].id
                      : nanoid('unknown');
                    if (!filteredArray?.length) {
                      columns[index].data.options?.push({
                        id,
                        value: hastGetTextContent(span),
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
              } else if (hastQuerySelector(child, '.checkbox')) {
                if (columns[index].type !== 'checkbox') {
                  columns[index].type = 'checkbox';
                }
                row[columns[index].id] = {
                  columnId: columns[index].id,
                  value: hastQuerySelector(child, '.checkbox-on')
                    ? true
                    : false,
                };
              } else if (columns[index].type === 'number') {
                row[columns[index].id] = {
                  columnId: columns[index].id,
                  value: Number(hastGetTextContent(child)),
                };
              } else {
                row[columns[index].id] = {
                  columnId: columns[index].id,
                  value: hastGetTextContent(child),
                };
              }
            });
            context.setGlobalContextStack('hast:table:column', columns);
            context.pushGlobalContextStack('hast:table:rows', row);
          }
        }
      }
    });
    walker.setLeave(async (o, context) => {
      if (o.node.type !== 'element') {
        return;
      }
      switch (o.node.tagName) {
        case 'div': {
          if (
            o.parent?.type === 'element' &&
            o.parent.tagName !== 'li' &&
            Array.isArray(o.node.properties?.className)
          ) {
            if (o.node.properties.className.includes('indented')) {
              context.closeNode();
            }
          }
          break;
        }
        case 'blockquote': {
          context.setGlobalContext('hast:blockquote', false);
          break;
        }
        case 'p': {
          if (!o.node.properties.id) {
            break;
          }
          if (
            o.parent!.type === 'element' &&
            o.parent!.children.length > o.index! + 1
          ) {
            const next = o.parent!.children[o.index! + 1];
            if (
              next.type === 'element' &&
              next.tagName === 'div' &&
              Array.isArray(next.properties?.className) &&
              next.properties.className.includes('indented')
            ) {
              // Close the node when leaving div indented
              break;
            }
          }
          context.closeNode();
          break;
        }
        case 'li': {
          context.closeNode();
          break;
        }
        case 'table': {
          const columns =
            context.getGlobalContextStack<BlocksuiteTableColumn>(
              'hast:table:column'
            );
          context.setGlobalContextStack('hast:table:column', []);
          const cells = Object.create(null);
          context
            .getGlobalContextStack<BlocksuiteTableRow>('hast:table:rows')
            .map(row => {
              Object.keys(row).forEach(columnId => {
                if (
                  columns.find(column => column.id === columnId)?.type ===
                  'select'
                ) {
                  row[columnId].value = (row[columnId].value as string[])[0];
                }
              });
              cells[nanoid('unknown')] = row;
            });
          context.setGlobalContextStack('hast:table:cells', []);
          context.openNode(
            {
              type: 'block',
              id: nanoid('block'),
              flavour: 'affine:database',
              props: {
                views: [
                  {
                    id: nanoid('block'),
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
                  delta: [],
                },
                columns,
                cells,
              },
              children: [],
            },
            'children'
          );
          const children = context.getGlobalContextStack<BlockSnapshot>(
            'hast:table:children'
          );
          context.setGlobalContextStack('hast:table:children', []);
          children.forEach(child => {
            context.openNode(child, 'children').closeNode();
          });
          context.closeNode();
          break;
        }
      }
    });
    return walker.walk(html, snapshot);
  };

  private _hastToDelta = (
    ast: HtmlAST,
    option: {
      trim: boolean;
    } = { trim: true }
  ): DeltaInsert<object>[] => {
    switch (ast.type) {
      case 'text': {
        if (option.trim) {
          if (ast.value.trim()) {
            return [{ insert: ast.value.trim() }];
          }
          return [];
        }
        if (ast.value) {
          return [{ insert: ast.value }];
        }
        return [];
      }
      case 'element': {
        switch (ast.tagName) {
          case 'ol':
          case 'ul': {
            return [];
          }
          case 'span': {
            return ast.children.flatMap(child => this._hastToDelta(child));
          }
          case 'strong': {
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes, bold: true };
                return delta;
              })
            );
          }
          case 'em': {
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes, italic: true };
                return delta;
              })
            );
          }
          case 'code': {
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes, code: true };
                return delta;
              })
            );
          }
          case 'del': {
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes, strike: true };
                return delta;
              })
            );
          }
          case 'u': {
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes, underline: true };
                return delta;
              })
            );
          }
          case 'a': {
            const href = ast.properties?.href;
            if (typeof href !== 'string') {
              return [];
            }
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes, link: href };
                return delta;
              })
            );
          }
          case 'mark': {
            // TODO: add support for highlight
            return ast.children.flatMap(child =>
              this._hastToDelta(child).map(delta => {
                delta.attributes = { ...delta.attributes };
                return delta;
              })
            );
          }
        }
      }
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._hastToDelta(child))
      : [];
  };
}
