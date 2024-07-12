import type { DeltaInsert } from '@blocksuite/inline';
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
import type {
  BlockSnapshot,
  DocSnapshot,
  SliceSnapshot,
} from '@blocksuite/store';
import type { ElementContent, Root, Text } from 'hast';

import { sha } from '@blocksuite/global/utils';
import {
  type AssetsManager,
  BlockSnapshotSchema,
  getAssetName,
  nanoid,
} from '@blocksuite/store';
import { ASTWalker, BaseAdapter } from '@blocksuite/store';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import {
  type BundledLanguage,
  type ThemedToken,
  bundledLanguagesInfo,
} from 'shiki';
import { unified } from 'unified';

import type { AffineTextAttributes } from '../inline/presets/affine-inline-specs.js';

import { isPlaintext } from '../../code-block/utils/code-languages.js';
import { DARK_THEME, LIGHT_THEME } from '../../code-block/utils/consts.js';
import { getHighLighter } from '../../code-block/utils/high-lighter.js';
import {
  highlightCache,
  type highlightCacheKey,
} from '../../code-block/utils/highlight-cache.js';
import { NoteDisplayMode } from '../types.js';
import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import {
  type HtmlAST,
  hastFlatNodes,
  hastGetElementChildren,
  hastGetTextChildren,
  hastGetTextChildrenOnlyAst,
  hastGetTextContent,
  hastQuerySelector,
} from './hast.js';
import { fetchImage, fetchable, mergeDeltas } from './utils.js';

export type Html = string;

type HtmlToSliceSnapshotPayload = {
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  file: Html;
  pageId: string;
  pageVersion: number;
  workspaceId: string;
  workspaceVersion: number;
};

export class HtmlAdapter extends BaseAdapter<Html> {
  private _astToHtml = (ast: Root) => {
    return unified().use(rehypeStringify).stringify(ast);
  };

  private _deltaToHast = (deltas: DeltaInsert<AffineTextAttributes>[]) => {
    return deltas.map(delta => {
      let hast: HtmlAST = {
        type: 'text',
        value: delta.insert,
      };
      if (delta.attributes?.reference) {
        const title = this.configs.get(
          'title:' + delta.attributes.reference.pageId
        );
        if (typeof title === 'string') {
          hast = {
            type: 'text',
            value: title,
          };
        }
      }
      if (delta.attributes) {
        if (delta.attributes.bold) {
          hast = {
            children: [hast],
            properties: {},
            tagName: 'strong',
            type: 'element',
          };
        }
        if (delta.attributes.italic) {
          hast = {
            children: [hast],
            properties: {},
            tagName: 'em',
            type: 'element',
          };
        }
        if (delta.attributes.code) {
          hast = {
            children: [hast],
            properties: {},
            tagName: 'code',
            type: 'element',
          };
        }
        if (delta.attributes.strike) {
          hast = {
            children: [hast],
            properties: {},
            tagName: 'del',
            type: 'element',
          };
        }
        if (delta.attributes.underline) {
          hast = {
            children: [hast],
            properties: {},
            tagName: 'u',
            type: 'element',
          };
        }
        if (delta.attributes.link) {
          hast = {
            children: [hast],
            properties: {
              href: delta.attributes.link,
            },
            tagName: 'a',
            type: 'element',
          };
        }
      }
      return hast;
    });
  };

  private _deltaToHighlightHasts = async (
    deltas: DeltaInsert[],
    rawLang: unknown
  ) => {
    deltas = deltas.reduce((acc, cur) => {
      return mergeDeltas(acc, cur, { force: true });
    }, [] as DeltaInsert<object>[]);
    if (!deltas.length) {
      return [
        {
          children: [
            {
              type: 'text',
              value: '',
            },
          ],
          tagName: 'span',
          type: 'element',
        },
      ] as ElementContent[];
    }

    const delta = deltas[0];
    if (typeof rawLang == 'string') {
      rawLang = rawLang.toLowerCase();
    }
    if (
      !rawLang ||
      typeof rawLang !== 'string' ||
      isPlaintext(rawLang) ||
      // The rawLang should not be 'Text' here
      rawLang === 'Text' ||
      !bundledLanguagesInfo.map(({ id }) => id).includes(rawLang as string)
    ) {
      return [
        {
          type: 'text',
          value: delta.insert,
        } as Text,
      ];
    }
    const lang = rawLang as BundledLanguage;

    const highlighter = await getHighLighter({
      langs: [lang],
      themes: [LIGHT_THEME, DARK_THEME],
    });
    const cacheKey: highlightCacheKey = `${delta.insert}-${rawLang}-light`;
    const cache = highlightCache.get(cacheKey);

    let tokens: Omit<ThemedToken, 'offset'>[];
    if (cache) {
      tokens = cache;
    } else {
      tokens = highlighter.codeToTokensBase(delta.insert, { lang }).reduce(
        (acc, cur, index) => {
          if (index === 0) {
            return cur;
          }

          return [...acc, { color: 'inherit', content: '\n' }, ...cur];
        },
        [] as Omit<ThemedToken, 'offset'>[]
      );
      highlightCache.set(cacheKey, tokens);
    }

    return tokens.map(token => {
      return {
        children: [
          {
            type: 'text',
            value: token.content,
          },
        ],
        properties: {
          style: `word-wrap: break-word; color: ${token.color};`,
        },
        tagName: 'span',
        type: 'element',
      } as ElementContent;
    });
  };

  private _hastToDelta = (
    ast: HtmlAST,
    option: {
      pageMap?: Map<string, string>;
      trim?: boolean;
    } = { trim: true }
  ): DeltaInsert<object>[] => {
    return this._hastToDeltaSpreaded(ast, option).reduce((acc, cur) => {
      return mergeDeltas(acc, cur);
    }, [] as DeltaInsert<object>[]);
  };

  private _hastToDeltaSpreaded = (
    ast: HtmlAST,
    option: {
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
          case 'span':
          case 'bdi':
          case 'bdo':
          case 'ins': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false })
            );
          }
          case 'strong':
          case 'b': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
                delta.attributes = { ...delta.attributes, bold: true };
                return delta;
              })
            );
          }
          case 'i':
          case 'em': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
                delta.attributes = { ...delta.attributes, italic: true };
                return delta;
              })
            );
          }
          case 'code': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
                delta.attributes = { ...delta.attributes, code: true };
                return delta;
              })
            );
          }
          case 'del': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
                delta.attributes = { ...delta.attributes, strike: true };
                return delta;
              })
            );
          }
          case 'u': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
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
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
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
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
                delta.attributes = { ...delta.attributes };
                return delta;
              })
            );
          }
          case 'br': {
            return [{ insert: '\n' }];
          }
        }
      }
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this._hastToDeltaSpreaded(child, option))
      : [];
  };

  private _traverseHtml = async (
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
        case 'img': {
          if (!assets) {
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
              try {
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
                    (res.headers.get('Content-Type')?.split('/').at(-1) ??
                      'png');
                const file = new File([await res.blob()], name, {
                  type: res.headers.get('Content-Type') ?? '',
                });
                blobId = await sha(await clonedRes.arrayBuffer());
                assets?.getAssets().set(blobId, file);
                await assets?.writeToBlob(blobId);
              } catch (_) {
                break;
              }
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
              : { ...code, tagName: 'div' };
          let codeLang = Array.isArray(code.properties?.className)
            ? code.properties.className.find(
                className =>
                  typeof className === 'string' && className.startsWith('code-')
              )
            : undefined;
          codeLang =
            typeof codeLang === 'string'
              ? codeLang.replace('code-', '')
              : undefined;
          context
            .openNode(
              {
                children: [],
                flavour: 'affine:code',
                id: nanoid(),
                props: {
                  language: codeLang ?? 'Plain Text',
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
          // Special case for no paragraph in blockquote
          const texts = hastGetTextChildren(o.node);
          // check if only blank text
          const onlyBlankText = texts.every(text => !text.value.trim());
          if (texts && !onlyBlankText) {
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
                        hastGetTextChildrenOnlyAst(o.node)
                      ),
                    },
                    type: 'quote',
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
          }
          break;
        }
        case 'body':
        case 'div':
        case 'footer': {
          if (
            // Check if it is a paragraph like div
            o.parent?.node.type === 'element' &&
            o.parent.node.tagName !== 'li' &&
            (hastGetElementChildren(o.node).every(child =>
              [
                'a',
                'b',
                'bdi',
                'bdo',
                'br',
                'code',
                'del',
                'em',
                'i',
                'ins',
                'mark',
                'span',
                'strong',
                'u',
              ].includes(child.tagName)
            ) ||
              o.node.children
                .map(child => child.type)
                .every(type => type === 'text'))
          ) {
            context
              .openNode(
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: nanoid(),
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: this._hastToDelta(o.node),
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
            context.skipAllChildren();
          }
          break;
        }
        case 'p': {
          context.openNode(
            {
              children: [],
              flavour: 'affine:paragraph',
              id: nanoid(),
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._hastToDelta(o.node),
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
          o.node = hastFlatNodes(
            o.node,
            tagName => tagName === 'div' || tagName === 'p'
          );
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
                      ? this._hastToDelta(o.node)
                      : this._hastToDelta(
                          hastQuerySelector(o.node, 'summary') ?? o.node
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
                    delta: this._hastToDelta(o.node),
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
        case 'iframe': {
          const src = o.node.properties?.src;
          if (typeof src !== 'string') {
            break;
          }
          if (src.startsWith('https://www.youtube.com/embed/')) {
            const videoId = src.substring(
              'https://www.youtube.com/embed/'.length,
              src.indexOf('?') !== -1 ? src.indexOf('?') : undefined
            );
            context
              .openNode(
                {
                  children: [],
                  flavour: 'affine:embed-youtube',
                  id: nanoid(),
                  props: {
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                  },
                  type: 'block',
                },
                'children'
              )
              .closeNode();
          }
          break;
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
            if (
              o.node.properties.className.includes(
                'affine-paragraph-block-container'
              ) ||
              o.node.properties.className.includes(
                'affine-block-children-container'
              ) ||
              o.node.properties.className.includes('indented')
            ) {
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
          if (
            o.next?.type === 'element' &&
            o.next.tagName === 'div' &&
            Array.isArray(o.next.properties?.className) &&
            (o.next.properties.className.includes(
              'affine-block-children-container'
            ) ||
              o.next.properties.className.includes('indented'))
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
      }
    });
    return walker.walk(html, snapshot);
  };

  private _traverseSnapshot = async (
    snapshot: BlockSnapshot,
    html: HtmlAST,
    assets?: AssetsManager
  ) => {
    const assetsIds: string[] = [];
    const walker = new ASTWalker<BlockSnapshot, HtmlAST>();
    walker.setONodeTypeGuard(
      (node): node is BlockSnapshot =>
        BlockSnapshotSchema.safeParse(node).success
    );
    walker.setEnter(async (o, context) => {
      const text = (o.node.props.text ?? { delta: [] }) as {
        delta: DeltaInsert[];
      };
      switch (o.node.flavour) {
        case 'affine:page': {
          context
            .openNode(
              {
                children: [],
                properties: {},
                tagName: 'html',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                children: [],
                properties: {},
                tagName: 'head',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                children: [],
                properties: {},
                tagName: 'style',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                type: 'text',
                value: `
                input[type='checkbox'] {
                  display: none;
                }
                label:before {
                  background: rgb(30, 150, 235);
                  border-radius: 3px;
                  height: 16px;
                  width: 16px;
                  display: inline-block;
                  cursor: pointer;
                }
                input[type='checkbox'] + label:before {
                  content: '';
                  background: rgb(30, 150, 235);
                  color: #fff;
                  font-size: 16px;
                  line-height: 16px;
                  text-align: center;
                }
                input[type='checkbox']:checked + label:before {
                  content: '✓';
                }
                `.replace(/\s\s+/g, ''),
              },
              'children'
            )
            .closeNode()
            .closeNode()
            .closeNode()
            .openNode(
              {
                children: [],
                properties: {},
                tagName: 'body',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                children: [],
                properties: {
                  style: 'width: 70vw; margin: 60px auto;',
                },
                tagName: 'div',
                type: 'element',
              },
              'children'
            )
            .openNode({
              type: 'comment',
              value: 'BlockSuiteDocTitlePlaceholder',
            })
            .closeNode();
          break;
        }
        case 'affine:code': {
          if (typeof o.node.props.language == 'string') {
            o.node.props.language = o.node.props.language.toLowerCase();
          }
          context
            .openNode(
              {
                children: [],
                properties: {},
                tagName: 'pre',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                children: await this._deltaToHighlightHasts(
                  text.delta,
                  o.node.props.language
                ),
                properties: {
                  className: [`code-${o.node.props.language}`],
                },
                tagName: 'code',
                type: 'element',
              },
              'children'
            )
            .closeNode()
            .closeNode();
          break;
        }
        case 'affine:paragraph': {
          switch (o.node.props.type) {
            case 'text': {
              context
                .openNode(
                  {
                    children: [],
                    properties: {
                      className: ['affine-paragraph-block-container'],
                    },
                    tagName: 'div',
                    type: 'element',
                  },
                  'children'
                )
                .openNode(
                  {
                    children: this._deltaToHast(text.delta),
                    properties: {},
                    tagName: 'p',
                    type: 'element',
                  },
                  'children'
                )
                .closeNode()
                .openNode(
                  {
                    children: [],
                    properties: {
                      className: ['affine-block-children-container'],
                      style: 'padding-left: 26px;',
                    },
                    tagName: 'div',
                    type: 'element',
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
                    properties: {
                      className: ['affine-paragraph-block-container'],
                    },
                    tagName: 'div',
                    type: 'element',
                  },
                  'children'
                )
                .openNode(
                  {
                    children: this._deltaToHast(text.delta),
                    properties: {},
                    tagName: o.node.props.type,
                    type: 'element',
                  },
                  'children'
                )
                .closeNode()
                .openNode(
                  {
                    children: [],
                    properties: {
                      className: ['affine-block-children-container'],
                      style: 'padding-left: 26px;',
                    },
                    tagName: 'div',
                    type: 'element',
                  },
                  'children'
                );
              break;
            }
            case 'quote': {
              context
                .openNode(
                  {
                    children: [],
                    properties: {
                      className: ['affine-paragraph-block-container'],
                    },
                    tagName: 'div',
                    type: 'element',
                  },
                  'children'
                )
                .openNode(
                  {
                    children: [],
                    properties: {
                      className: ['quote'],
                    },
                    tagName: 'blockquote',
                    type: 'element',
                  },
                  'children'
                )
                .openNode(
                  {
                    children: this._deltaToHast(text.delta),
                    properties: {},
                    tagName: 'p',
                    type: 'element',
                  },
                  'children'
                )
                .closeNode()
                .closeNode()
                .openNode(
                  {
                    children: [],
                    properties: {
                      className: ['affine-block-children-container'],
                      style: 'padding-left: 26px;',
                    },
                    tagName: 'div',
                    type: 'element',
                  },
                  'children'
                );
              break;
            }
          }
          break;
        }
        case 'affine:list': {
          context
            .openNode(
              {
                children: [],
                properties: {
                  className: ['affine-list-block-container'],
                },
                tagName: 'div',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                children: [],
                properties: {
                  style:
                    o.node.props.type === 'todo'
                      ? 'list-style-type: none;'
                      : '',
                },
                tagName: o.node.props.type === 'numbered' ? 'ol' : 'ul',
                type: 'element',
              },
              'children'
            );
          const liChildren = this._deltaToHast(text.delta);
          if (o.node.props.type === 'todo') {
            liChildren.unshift({
              children: [
                {
                  children: [],
                  properties: {},
                  tagName: 'label',
                  type: 'element',
                },
              ],
              properties: {
                checked: o.node.props.checked as boolean,
                type: 'checkbox',
              },
              tagName: 'input',
              type: 'element',
            });
          }
          context
            .openNode(
              {
                children: liChildren,
                properties: {},
                tagName: 'li',
                type: 'element',
              },
              'children'
            )
            .closeNode()
            .closeNode()
            .openNode(
              {
                children: [],
                properties: {
                  className: ['affine-block-children-container'],
                  style: 'padding-left: 26px;',
                },
                tagName: 'div',
                type: 'element',
              },
              'children'
            );
          break;
        }
        case 'affine:divider': {
          context
            .openNode(
              {
                children: [],
                properties: {},
                tagName: 'hr',
                type: 'element',
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
          const isScaledImage = o.node.props.width && o.node.props.height;
          const widthStyle = isScaledImage
            ? {
                height: `${o.node.props.height}px`,
                width: `${o.node.props.width}px`,
              }
            : {};

          context
            .openNode(
              {
                children: [],
                properties: {
                  className: ['affine-image-block-container'],
                },
                tagName: 'figure',
                type: 'element',
              },
              'children'
            )
            .openNode(
              {
                children: [],
                properties: {
                  alt: blobName,
                  src: `assets/${blobName}`,
                  title: (o.node.props.caption as string | undefined) ?? null,
                  ...widthStyle,
                },
                tagName: 'img',
                type: 'element',
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
      switch (o.node.flavour) {
        case 'affine:page': {
          context.closeNode().closeNode().closeNode();
          break;
        }
        case 'affine:paragraph': {
          context.closeNode().closeNode();
          break;
        }
        case 'affine:list': {
          context.closeNode().closeNode();
          break;
        }
      }
    });
    return {
      assetsIds,
      ast: (await walker.walk(snapshot, html)) as Root,
    };
  };

  private _htmlToAst(html: Html) {
    return unified().use(rehypeParse).parse(html);
  }

  override async fromBlockSnapshot(
    payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    const root: Root = {
      children: [
        {
          type: 'doctype',
        },
      ],
      type: 'root',
    };
    const { assetsIds, ast } = await this._traverseSnapshot(
      payload.snapshot,
      root,
      payload.assets
    );
    return {
      assetsIds,
      file: this._astToHtml(ast),
    };
  }

  override async fromDocSnapshot(
    payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<string>> {
    const { assetsIds, file } = await this.fromBlockSnapshot({
      assets: payload.assets,
      snapshot: payload.snapshot.blocks,
    });
    return {
      assetsIds,
      file: file.replace(
        '<!--BlockSuiteDocTitlePlaceholder-->',
        `<h1>${payload.snapshot.meta.title}</h1>`
      ),
    };
  }

  override async fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    let buffer = '';
    const sliceAssetsIds: string[] = [];
    for (const contentSlice of payload.snapshot.content) {
      const root: Root = {
        children: [],
        type: 'root',
      };
      const { assetsIds, ast } = await this._traverseSnapshot(
        contentSlice,
        root,
        payload.assets
      );
      sliceAssetsIds.push(...assetsIds);
      buffer += this._astToHtml(ast);
    }
    const html = buffer;
    return {
      assetsIds: sliceAssetsIds,
      file: html,
    };
  }

  override toBlockSnapshot(
    payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    const htmlAst = this._htmlToAst(payload.file);
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
    return this._traverseHtml(
      htmlAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets
    );
  }

  override async toDocSnapshot(
    payload: ToDocSnapshotPayload<string>
  ): Promise<DocSnapshot> {
    const htmlAst = this._htmlToAst(payload.file);
    const titleAst = hastQuerySelector(htmlAst, 'title');
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
          await this._traverseHtml(
            htmlAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets
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
        id: nanoid(),
        tags: [],
        title: hastGetTextContent(titleAst, 'Untitled'),
      },
      type: 'page',
    };
  }

  override async toSliceSnapshot(
    payload: HtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const htmlAst = this._htmlToAst(payload.file);
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
    const contentSlice = (await this._traverseHtml(
      htmlAst,
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
