import type { DeltaInsert } from '@blocksuite/inline';
import type {
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromDocSnapshotPayload,
  FromDocSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
} from '@blocksuite/store';

import { isEqual, sha } from '@blocksuite/global/utils';
import {
  ASTWalker,
  type AssetsManager,
  BaseAdapter,
  type BlockSnapshot,
  type DocSnapshot,
  type SliceSnapshot,
  getAssetName,
  nanoid,
} from '@blocksuite/store';
import rehypeParse from 'rehype-parse';
import { unified } from 'unified';

import { getTagColor } from '../../database-block/data-view/utils/tags/colors.js';
import { NoteDisplayMode } from '../types.js';
import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import {
  type HtmlAST,
  hastGetElementChildren,
  hastGetTextChildrenOnlyAst,
  hastGetTextContent,
  hastQuerySelector,
} from './hast.js';
import { createText, fetchImage, fetchable, isText } from './utils.js';

export type NotionHtml = string;

type NotionHtmlToSliceSnapshotPayload = {
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  file: NotionHtml;
  pageId: string;
  pageVersion: number;
  workspaceId: string;
  workspaceVersion: number;
};

type NotionHtmlToDocSnapshotPayload = {
  assets?: AssetsManager;
  file: NotionHtml;
  pageId?: string;
  pageMap?: Map<string, string>;
};

type NotionHtmlToBlockSnapshotPayload = NotionHtmlToDocSnapshotPayload;

const ColumnClassMap: Record<string, string> = {
  typesCheckbox: 'checkbox',
  typesMultipleSelect: 'multi-select',
  typesNumber: 'number',
  typesSelect: 'select',
  typesText: 'rich-text',
  typesTitle: 'title',
};

type BlocksuiteTableColumn = {
  data: {
    options?: {
      color: string;
      id: string;
      value: string;
    }[];
  };
  id: string;
  name: string;
  type: string;
};

type BlocksuiteTableRow = Record<
  string,
  {
    columnId: string;
    value: unknown;
  }
>;

export class NotionHtmlAdapter extends BaseAdapter<NotionHtml> {
  private _hastToDelta = (
    ast: HtmlAST,
    option: {
      pageMap?: Map<string, string>;
      trim?: boolean;
    } = { trim: true }
  ): DeltaInsert<object>[] => {
    return this._hastToDeltaSpreaded(ast, option).reduce((acc, cur) => {
      if (acc.length === 0) {
        return [cur];
      }
      const last = acc[acc.length - 1];
      if (
        typeof last.insert === 'string' &&
        typeof cur.insert === 'string' &&
        isEqual(last.attributes, cur.attributes)
      ) {
        last.insert += cur.insert;
        return acc;
      }
      return [...acc, cur];
    }, [] as DeltaInsert<object>[]);
  };

  private _hastToDeltaSpreaded = (
    ast: HtmlAST,
    option: {
      pageMap?: Map<string, string>;
      trim?: boolean;
    } = { trim: true }
  ): DeltaInsert<object>[] => {
    if (option.trim === undefined) {
      option.trim = true;
    }
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
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option)
            );
          }
          case 'strong': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option).map(delta => {
                delta.attributes = { ...delta.attributes, bold: true };
                return delta;
              })
            );
          }
          case 'em': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option).map(delta => {
                delta.attributes = { ...delta.attributes, italic: true };
                return delta;
              })
            );
          }
          case 'code': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option).map(delta => {
                delta.attributes = { ...delta.attributes, code: true };
                return delta;
              })
            );
          }
          case 'del': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option).map(delta => {
                delta.attributes = { ...delta.attributes, strike: true };
                return delta;
              })
            );
          }
          case 'u': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option).map(delta => {
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
              this._hastToDeltaSpreaded(child, option).map(delta => {
                if (option.pageMap) {
                  const pageId = option.pageMap.get(decodeURIComponent(href));
                  if (pageId) {
                    delta.attributes = {
                      ...delta.attributes,
                      reference: {
                        pageId,
                        type: 'LinkedPage',
                      },
                    };
                    delta.insert = ' ';
                    return delta;
                  }
                }
                if (href.startsWith('http')) {
                  delta.attributes = {
                    ...delta.attributes,
                    link: href,
                  };
                  return delta;
                }
                return delta;
              })
            );
          }
          case 'mark': {
            // TODO: add support for highlight
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, option).map(delta => {
                delta.attributes = { ...delta.attributes };
                return delta;
              })
            );
          }
        }
      }
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._hastToDeltaSpreaded(child, option))
      : [];
  };

  private _traverseNotionHtml = async (
    html: HtmlAST,
    snapshot: BlockSnapshot,
    assets?: AssetsManager,
    pageMap?: Map<string, string>
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
        case 'img': {
          if (!assets) {
            break;
          }
          if (context.getGlobalContext('hast:disableimg')) {
            break;
          }
          const image = o.node;
          const imageURL =
            typeof image?.properties.src === 'string'
              ? image.properties.src
              : '';
          if (imageURL) {
            let blobId = '';
            if (!fetchable(imageURL)) {
              assets.getAssets().forEach((_value, key) => {
                const attachmentName = getAssetName(assets.getAssets(), key);
                if (decodeURIComponent(imageURL).includes(attachmentName)) {
                  blobId = key;
                }
              });
            } else {
              const res = await fetchImage(
                imageURL,
                undefined,
                this.configs.get('imageProxy') as string
              );
              const clonedRes = res.clone();
              const name =
                getFilenameFromContentDisposition(
                  res.headers.get('Content-Disposition') ?? ''
                ) ??
                imageURL.split('/').at(-1) ??
                'image' +
                  '.' +
                  (res.headers.get('Content-Type')?.split('/').at(-1) ?? 'png');
              const file = new File([await res.blob()], name, {
                type: res.headers.get('Content-Type') ?? '',
              });
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
            context.skipAllChildren();
            break;
          }
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
              : { ...code, tag: 'div' };
          context
            .openNode(
              {
                children: [],
                flavour: 'affine:code',
                id: nanoid(),
                props: {
                  language: 'Plain Text',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(codeText, { trim: false }),
                  },
                },
                type: 'block',
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
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(
                      hastGetTextChildrenOnlyAst(o.node),
                      { pageMap }
                    ),
                  },
                  type: 'quote',
                },
                type: 'block',
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
              children: [],
              flavour: 'affine:paragraph',
              id: nanoid(),
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._hastToDelta(o.node, { pageMap }),
                },
                type: context.getGlobalContext('hast:blockquote')
                  ? 'quote'
                  : 'text',
              },
              type: 'block',
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
                children: [],
                flavour: 'affine:paragraph',
                id: nanoid(),
                props: {
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(o.node, { pageMap }),
                  },
                  type: o.node.tagName,
                },
                type: 'block',
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
              children: [],
              flavour: 'affine:list',
              id: nanoid(),
              props: {
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
                text: {
                  '$blocksuite:internal:text$': true,
                  delta:
                    listType !== 'toggle'
                      ? this._hastToDelta(o.node, { pageMap })
                      : this._hastToDelta(
                          hastQuerySelector(o.node, 'summary') ?? o.node,
                          { pageMap }
                        ),
                },
                type: listType,
              },
              type: 'block',
            },
            'children'
          );
          break;
        }
        case 'hr': {
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
        case 'figure': {
          // Notion page link
          if (hastQuerySelector(o.node, '.link-to-page')) {
            context
              .openNode(
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: nanoid(),
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: this._hastToDelta(o.node, { pageMap }),
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
            context.skipAllChildren();
            break;
          }
          // Notion callout
          if (hastQuerySelector(o.node, '.callout')) {
            context
              .openNode(
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: nanoid(),
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: this._hastToDelta(o.node, { pageMap }),
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
            context.skipAllChildren();
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
                  children: [],
                  flavour: 'affine:bookmark',
                  id: nanoid(),
                  props: {
                    description: bookmarkDescription,
                    icon: bookmarkIconURL,
                    title: bookmarkTitle,
                    type: 'card',
                    url: bookmarkURL ?? '',
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
            context.skipAllChildren();
            break;
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
            if (!fetchable(imageURL)) {
              assets.getAssets().forEach((_value, key) => {
                const attachmentName = getAssetName(assets.getAssets(), key);
                if (decodeURIComponent(imageURL).includes(attachmentName)) {
                  blobId = key;
                }
              });
            } else {
              const res = await fetchImage(
                imageURL,
                undefined,
                this.configs.get('imageProxy') as string
              );
              const clonedRes = res.clone();
              const name =
                getFilenameFromContentDisposition(
                  res.headers.get('Content-Disposition') ?? ''
                ) ??
                (imageURL.split('/').at(-1) ?? 'image') +
                  '.' +
                  (res.headers.get('Content-Type')?.split('/').at(-1) ?? 'png');
              const file = new File([await res.blob()], name, {
                type: res.headers.get('Content-Type') ?? '',
              });
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
            context.skipAllChildren();
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
            if (!fetchable(embededURL)) {
              assets.getAssets().forEach((value, key) => {
                const embededName = getAssetName(assets.getAssets(), key);
                if (decodeURIComponent(embededURL).includes(embededName)) {
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
                (embededURL.split('/').at(-1) ?? 'file') +
                  '.' +
                  (res.headers.get('Content-Type')?.split('/').at(-1) ??
                    'blob');
              const file = new File([await res.blob()], name, {
                type: res.headers.get('Content-Type') ?? '',
              });
              size = file.size;
              type = file.type;
              blobId = await sha(await resCloned.arrayBuffer());
              assets?.getAssets().set(blobId, file);
              await assets?.writeToBlob(blobId);
            }
            context
              .openNode(
                {
                  children: [],
                  flavour: 'affine:attachment',
                  id: nanoid(),
                  props: {
                    name,
                    size,
                    sourceId: blobId,
                    type,
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
            context.skipAllChildren();
            break;
          }
          break;
        }
        case 'th': {
          const columnId = nanoid();
          const columnTypeClass = hastQuerySelector(o.node, 'svg')?.properties
            ?.className;
          const columnType = Array.isArray(columnTypeClass)
            ? ColumnClassMap[columnTypeClass[0]] ?? 'rich-text'
            : 'rich-text';
          context.pushGlobalContextStack<BlocksuiteTableColumn>(
            'hast:table:column',
            {
              data: Object.create(null),
              id: columnId,
              name: hastGetTextContent(hastGetTextChildrenOnlyAst(o.node)),
              type: columnType,
            }
          );
          // disable icon img in th
          context.setGlobalContext('hast:disableimg', true);
          break;
        }
        case 'tr': {
          if (
            o.parent?.node.type === 'element' &&
            o.parent.node.tagName === 'tbody'
          ) {
            const columns =
              context.getGlobalContextStack<BlocksuiteTableColumn>(
                'hast:table:column'
              );
            const row = Object.create(null);
            let plainTable = false;
            hastGetElementChildren(o.node).forEach((child, index) => {
              if (plainTable || columns[index] === undefined) {
                plainTable = true;
                if (columns[index] === undefined) {
                  columns.push({
                    data: Object.create(null),
                    id: nanoid(),
                    name: '',
                    type: 'rich-text',
                  });
                  context.pushGlobalContextStack<BlockSnapshot>(
                    'hast:table:children',
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: nanoid(),
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: this._hastToDelta(child),
                        },
                        type: 'text',
                      },
                      type: 'block',
                    }
                  );
                }
                context.pushGlobalContextStack<BlockSnapshot>(
                  'hast:table:children',
                  {
                    children: [],
                    flavour: 'affine:paragraph',
                    id: nanoid(),
                    props: {
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: this._hastToDelta(child),
                      },
                      type: 'text',
                    },
                    type: 'block',
                  }
                );
                row[columns[index].id] = {
                  columnId: columns[index].id,
                  value: hastGetTextContent(child),
                };
              } else if (hastQuerySelector(child, '.cell-title')) {
                context.pushGlobalContextStack<BlockSnapshot>(
                  'hast:table:children',
                  {
                    children: [],
                    flavour: 'affine:paragraph',
                    id: nanoid(),
                    props: {
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: this._hastToDelta(child, { pageMap }),
                      },
                      type: 'text',
                    },
                    type: 'block',
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
                if (!['multi-select', 'select'].includes(columns[index].type)) {
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
                      : nanoid();
                    if (!filteredArray?.length) {
                      columns[index].data.options?.push({
                        color: getTagColor(),
                        id,
                        value: hastGetTextContent(span),
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
                const text = hastGetTextContent(child);
                const number = Number(text);
                if (Number.isNaN(number)) {
                  if (columns[index].type !== 'rich-text') {
                    columns[index].type = 'rich-text';
                  }
                  row[columns[index].id] = {
                    columnId: columns[index].id,
                    value: createText(text),
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
                  value: hastGetTextContent(child),
                };
              }
              if (
                columns[index].type === 'rich-text' &&
                !isText(row[columns[index].id].value)
              ) {
                row[columns[index].id] = {
                  columnId: columns[index].id,
                  value: createText(row[columns[index].id].value),
                };
              }
            });
            context.setGlobalContextStack('hast:table:column', columns);
            context.pushGlobalContextStack('hast:table:rows', row);
          }
        }
      }
    });
    walker.setLeave((o, context) => {
      if (o.node.type !== 'element') {
        return;
      }
      switch (o.node.tagName) {
        case 'div': {
          if (
            o.parent?.node.type === 'element' &&
            o.parent.node.tagName !== 'li' &&
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
            o.next?.type === 'element' &&
            o.next.tagName === 'div' &&
            Array.isArray(o.next.properties?.className) &&
            o.next.properties.className.includes('indented')
          ) {
            // Close the node when leaving div indented
            break;
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
          const children = context.getGlobalContextStack<BlockSnapshot>(
            'hast:table:children'
          );
          context.setGlobalContextStack('hast:table:children', []);
          const cells = Object.create(null);
          context
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
          context.setGlobalContextStack('hast:table:cells', []);
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
                      titleColumn:
                        columns.find(column => column.type === 'title')?.id ??
                        '',
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
          children.forEach(child => {
            context.openNode(child, 'children').closeNode();
          });
          context.closeNode();
          break;
        }
        case 'th': {
          context.setGlobalContext('hast:disableimg', false);
          break;
        }
      }
    });
    return walker.walk(html, snapshot);
  };

  private _htmlToAst(notionHtml: NotionHtml) {
    return unified().use(rehypeParse).parse(notionHtml);
  }

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<NotionHtml>> {
    throw new Error('Method not implemented.');
  }

  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<NotionHtml>> {
    throw new Error('Method not implemented.');
  }

  override fromSliceSnapshot(
    _payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<NotionHtml>> {
    throw new Error('Method not implemented.');
  }

  override toBlockSnapshot(
    payload: NotionHtmlToBlockSnapshotPayload
  ): Promise<BlockSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
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
    return this._traverseNotionHtml(
      notionHtmlAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets,
      payload.pageMap
    );
  }

  override async toDoc(payload: NotionHtmlToDocSnapshotPayload) {
    const snapshot = await this.toDocSnapshot(payload);
    return this.job.snapshotToDoc(snapshot);
  }

  override async toDocSnapshot(
    payload: NotionHtmlToDocSnapshotPayload
  ): Promise<DocSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
    const titleAst = hastQuerySelector(notionHtmlAst, 'title');
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
          await this._traverseNotionHtml(
            notionHtmlAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets,
            payload.pageMap
          ),
        ],
        flavour: 'affine:page',
        id: nanoid(),
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: this._hastToDelta(
              titleAst ?? {
                type: 'text',
                value: 'Untitled',
              }
            ),
          },
        },
        type: 'block',
      },
      meta: {
        createDate: Date.now(),
        id: payload.pageId ?? nanoid(),
        tags: [],
        title: hastGetTextContent(titleAst, 'Untitled'),
      },
      type: 'page',
    };
  }

  override async toSliceSnapshot(
    payload: NotionHtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const notionHtmlAst = this._htmlToAst(payload.file);
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
    const contentSlice = (await this._traverseNotionHtml(
      notionHtmlAst,
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
