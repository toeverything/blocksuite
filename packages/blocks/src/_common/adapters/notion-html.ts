import type { DeltaInsert } from '@blocksuite/inline';

import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import { getFilenameFromContentDisposition } from '@blocksuite/affine-shared/utils';
import { getTagColor } from '@blocksuite/data-view';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { isEqual, sha } from '@blocksuite/global/utils';
import {
  type AssetsManager,
  ASTWalker,
  BaseAdapter,
  type BlockSnapshot,
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
} from '@blocksuite/store';
import { collapseWhiteSpace } from 'collapse-white-space';
import rehypeParse from 'rehype-parse';
import { unified } from 'unified';

import {
  hastGetElementChildren,
  hastGetTextChildrenOnlyAst,
  hastGetTextContent,
  hastQuerySelector,
  type HtmlAST,
} from './hast.js';
import { createText, fetchable, fetchImage, isText } from './utils.js';

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

type NotionHtmlToDocSnapshotPayload = {
  file: NotionHtml;
  assets?: AssetsManager;
  pageId?: string;
  pageMap?: Map<string, string>;
};

type NotionHtmlToBlockSnapshotPayload = NotionHtmlToDocSnapshotPayload;

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
      trim?: boolean;
      pre?: boolean;
      pageMap?: Map<string, string>;
    } = { trim: true, pre: false }
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
      trim?: boolean;
      pre?: boolean;
      pageMap?: Map<string, string>;
    } = { trim: true, pre: false }
  ): DeltaInsert<object>[] => {
    if (option.trim === undefined) {
      option.trim = true;
    }
    switch (ast.type) {
      case 'text': {
        if (option.pre) {
          return [{ insert: ast.value }];
        }
        if (option.trim) {
          const value = collapseWhiteSpace(ast.value, { trim: option.trim });
          if (value) {
            return [{ insert: value }];
          }
          return [];
        }
        if (ast.value) {
          return [{ insert: collapseWhiteSpace(ast.value) }];
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
                        type: 'LinkedPage',
                        pageId,
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
              const imageURLSplit = imageURL.split('/');
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
                imageURL,
                undefined,
                this.configs.get('imageProxy') as string
              );
              if (!res) {
                break;
              }
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
                type: 'block',
                id: nanoid(),
                flavour: 'affine:code',
                props: {
                  language: 'Plain Text',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(codeText, {
                      trim: false,
                      pre: true,
                    }),
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
                id: nanoid(),
                flavour: 'affine:paragraph',
                props: {
                  type: 'quote',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(
                      hastGetTextChildrenOnlyAst(o.node),
                      { pageMap }
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
              id: nanoid(),
              flavour: 'affine:paragraph',
              props: {
                type: context.getGlobalContext('hast:blockquote')
                  ? 'quote'
                  : 'text',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._hastToDelta(o.node, { pageMap }),
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
                id: nanoid(),
                flavour: 'affine:paragraph',
                props: {
                  type: o.node.tagName,
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this._hastToDelta(o.node, { pageMap }),
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
              id: nanoid(),
              flavour: 'affine:list',
              props: {
                type: listType,
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
        case 'figure': {
          // Notion page link
          if (hastQuerySelector(o.node, '.link-to-page')) {
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
                      delta: this._hastToDelta(o.node, { pageMap }),
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
          // Notion equation
          if (hastQuerySelector(o.node, '.equation-container')) {
            const latex = hastGetTextContent(
              hastQuerySelector(o.node, 'annotation')
            );
            context
              .openNode(
                {
                  type: 'block',
                  id: nanoid(),
                  flavour: 'affine:latex',
                  props: {
                    latex,
                  },
                  children: [],
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
                  type: 'block',
                  id: nanoid(),
                  flavour: 'affine:paragraph',
                  props: {
                    type: 'text',
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: this._hastToDelta(o.node, { pageMap }),
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
                  id: nanoid(),
                  flavour: 'affine:bookmark',
                  props: {
                    type: 'card',
                    url: bookmarkURL ?? '',
                    title: bookmarkTitle,
                    description: bookmarkDescription,
                    icon: bookmarkIconURL,
                  },
                  children: [],
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
              const imageURLSplit = imageURL.split('/');
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
                imageURL,
                undefined,
                this.configs.get('imageProxy') as string
              );
              if (!res) {
                break;
              }
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
              const embededURLSplit = embededURL.split('/');
              while (embededURLSplit.length > 0) {
                const key = assets
                  .getPathBlobIdMap()
                  .get(decodeURIComponent(embededURLSplit.join('/')));
                if (key) {
                  blobId = key;
                  break;
                }
                embededURLSplit.shift();
              }
              const value = assets.getAssets().get(blobId);
              if (value) {
                name = getAssetName(assets.getAssets(), blobId);
                size = value.size;
                type = value.type;
              }
            } else {
              const res = await fetch(embededURL).catch(error => {
                console.warn('Error fetching embed:', error);
                return null;
              });
              if (!res) {
                break;
              }
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
                  type: 'block',
                  id: nanoid(),
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
            ? (ColumnClassMap[columnTypeClass[0]] ?? 'rich-text')
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
                    type: 'rich-text',
                    name: '',
                    data: Object.create(null),
                    id: nanoid(),
                  });
                  context.pushGlobalContextStack<BlockSnapshot>(
                    'hast:table:children',
                    {
                      type: 'block',
                      id: nanoid(),
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
                }
                context.pushGlobalContextStack<BlockSnapshot>(
                  'hast:table:children',
                  {
                    type: 'block',
                    id: nanoid(),
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
                row[columns[index].id] = {
                  columnId: columns[index].id,
                  value: hastGetTextContent(child),
                };
              } else if (hastQuerySelector(child, '.cell-title')) {
                context.pushGlobalContextStack<BlockSnapshot>(
                  'hast:table:children',
                  {
                    type: 'block',
                    id: nanoid(),
                    flavour: 'affine:paragraph',
                    props: {
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: this._hastToDelta(child, { pageMap }),
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
                const text = hastGetTextContent(child);
                const number = Number(text);
                if (Number.isNaN(number)) {
                  columns[index].type = 'rich-text';
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
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionHtmlAdapter.fromBlockSnapshot is not implemented'
    );
  }

  override fromDocSnapshot(
    _payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<NotionHtml>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionHtmlAdapter.fromDocSnapshot is not implemented'
    );
  }

  override fromSliceSnapshot(
    _payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<NotionHtml>> {
    throw new BlockSuiteError(
      ErrorCode.TransformerNotImplementedError,
      'NotionHtmlAdapter.fromSliceSnapshot is not implemented'
    );
  }

  override toBlockSnapshot(
    payload: NotionHtmlToBlockSnapshotPayload
  ): Promise<BlockSnapshot> {
    const notionHtmlAst = this._htmlToAst(payload.file);
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
        id: payload.pageId ?? nanoid(),
        title: hastGetTextContent(titleAst, 'Untitled'),
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
            delta: this._hastToDelta(
              titleAst ?? {
                type: 'text',
                value: 'Untitled',
              }
            ),
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
          await this._traverseNotionHtml(
            notionHtmlAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets,
            payload.pageMap
          ),
        ],
      },
    };
  }

  override async toSliceSnapshot(
    payload: NotionHtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const notionHtmlAst = this._htmlToAst(payload.file);
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
    const contentSlice = (await this._traverseNotionHtml(
      notionHtmlAst,
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
