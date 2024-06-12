import { sha } from '@blocksuite/global/utils';
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
import {
  type AssetsManager,
  BlockSnapshotSchema,
  getAssetName,
  nanoid,
} from '@blocksuite/store';
import { ASTWalker, BaseAdapter } from '@blocksuite/store';
import type { ElementContent, Root, Text } from 'hast';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import {
  type BundledLanguage,
  bundledLanguagesInfo,
  type ThemedToken,
} from 'shiki';
import { unified } from 'unified';

import { isPlaintext } from '../../code-block/utils/code-languages.js';
import { DARK_THEME, LIGHT_THEME } from '../../code-block/utils/consts.js';
import { getHighLighter } from '../../code-block/utils/high-lighter.js';
import {
  highlightCache,
  type highlightCacheKey,
} from '../../code-block/utils/highlight-cache.js';
import type { AffineTextAttributes } from '../inline/presets/affine-inline-specs.js';
import { NoteDisplayMode } from '../types.js';
import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import {
  hastFlatNodes,
  hastGetElementChildren,
  hastGetTextChildren,
  hastGetTextChildrenOnlyAst,
  hastGetTextContent,
  hastQuerySelector,
  type HtmlAST,
} from './hast.js';
import { fetchable, fetchImage, mergeDeltas } from './utils.js';

export type Html = string;

type HtmlToSliceSnapshotPayload = {
  file: Html;
  assets?: AssetsManager;
  blockVersions: Record<string, number>;
  pageVersion: number;
  workspaceVersion: number;
  workspaceId: string;
  pageId: string;
};

export class HtmlAdapter extends BaseAdapter<Html> {
  private _astToHtml = (ast: Root) => {
    return unified().use(rehypeStringify).stringify(ast);
  };

  private _htmlToAst(html: Html) {
    return unified().use(rehypeParse).parse(html);
  }

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
                type: 'element',
                tagName: 'html',
                properties: {},
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'element',
                tagName: 'head',
                properties: {},
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'element',
                tagName: 'style',
                properties: {},
                children: [],
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
                type: 'element',
                tagName: 'body',
                properties: {},
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'element',
                tagName: 'div',
                properties: {
                  style: 'width: 70vw; margin: 60px auto;',
                },
                children: [],
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
                type: 'element',
                tagName: 'pre',
                properties: {},
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'element',
                tagName: 'code',
                properties: {
                  className: [`code-${o.node.props.language}`],
                },
                children: await this._deltaToHighlightHasts(
                  text.delta,
                  o.node.props.language
                ),
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
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['affine-paragraph-block-container'],
                    },
                    children: [],
                  },
                  'children'
                )
                .openNode(
                  {
                    type: 'element',
                    tagName: 'p',
                    properties: {},
                    children: this._deltaToHast(text.delta),
                  },
                  'children'
                )
                .closeNode()
                .openNode(
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['affine-block-children-container'],
                      style: 'padding-left: 26px;',
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
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['affine-paragraph-block-container'],
                    },
                    children: [],
                  },
                  'children'
                )
                .openNode(
                  {
                    type: 'element',
                    tagName: o.node.props.type,
                    properties: {},
                    children: this._deltaToHast(text.delta),
                  },
                  'children'
                )
                .closeNode()
                .openNode(
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['affine-block-children-container'],
                      style: 'padding-left: 26px;',
                    },
                    children: [],
                  },
                  'children'
                );
              break;
            }
            case 'quote': {
              context
                .openNode(
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['affine-paragraph-block-container'],
                    },
                    children: [],
                  },
                  'children'
                )
                .openNode(
                  {
                    type: 'element',
                    tagName: 'blockquote',
                    properties: {
                      className: ['quote'],
                    },
                    children: [],
                  },
                  'children'
                )
                .openNode(
                  {
                    type: 'element',
                    tagName: 'p',
                    properties: {},
                    children: this._deltaToHast(text.delta),
                  },
                  'children'
                )
                .closeNode()
                .closeNode()
                .openNode(
                  {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                      className: ['affine-block-children-container'],
                      style: 'padding-left: 26px;',
                    },
                    children: [],
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
                type: 'element',
                tagName: 'div',
                properties: {
                  className: ['affine-list-block-container'],
                },
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'element',
                tagName: o.node.props.type === 'numbered' ? 'ol' : 'ul',
                properties: {
                  style:
                    o.node.props.type === 'todo'
                      ? 'list-style-type: none;'
                      : '',
                },
                children: [],
              },
              'children'
            );
          const liChildren = this._deltaToHast(text.delta);
          if (o.node.props.type === 'todo') {
            liChildren.unshift({
              type: 'element',
              tagName: 'input',
              properties: {
                type: 'checkbox',
                checked: o.node.props.checked as boolean,
              },
              children: [
                {
                  type: 'element',
                  tagName: 'label',
                  properties: {},
                  children: [],
                },
              ],
            });
          }
          context
            .openNode(
              {
                type: 'element',
                tagName: 'li',
                properties: {},
                children: liChildren,
              },
              'children'
            )
            .closeNode()
            .closeNode()
            .openNode(
              {
                type: 'element',
                tagName: 'div',
                properties: {
                  className: ['affine-block-children-container'],
                  style: 'padding-left: 26px;',
                },
                children: [],
              },
              'children'
            );
          break;
        }
        case 'affine:divider': {
          context
            .openNode(
              {
                type: 'element',
                tagName: 'hr',
                properties: {},
                children: [],
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
                width: `${o.node.props.width}px`,
                height: `${o.node.props.height}px`,
              }
            : {};

          context
            .openNode(
              {
                type: 'element',
                tagName: 'figure',
                properties: {
                  className: ['affine-image-block-container'],
                },
                children: [],
              },
              'children'
            )
            .openNode(
              {
                type: 'element',
                tagName: 'img',
                properties: {
                  src: `assets/${blobName}`,
                  alt: blobName,
                  title: (o.node.props.caption as string | undefined) ?? null,
                  ...widthStyle,
                },
                children: [],
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
      ast: (await walker.walk(snapshot, html)) as Root,
      assetsIds,
    };
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
                type: 'block',
                id: nanoid(),
                flavour: 'affine:code',
                props: {
                  language: codeLang ?? 'Plain Text',
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
          // Special case for no paragraph in blockquote
          const texts = hastGetTextChildren(o.node);
          // check if only blank text
          const onlyBlankText = texts.every(text => !text.value.trim());
          if (texts && !onlyBlankText) {
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
                        hastGetTextChildrenOnlyAst(o.node)
                      ),
                    },
                  },
                  children: [],
                },
                'children'
              )
              .closeNode();
          }
          break;
        }
        case 'body':
        case 'div': {
          if (
            // Check if it is a paragraph like div
            o.parent?.node.type === 'element' &&
            o.parent.node.tagName !== 'li' &&
            (hastGetElementChildren(o.node).every(child =>
              [
                'span',
                'strong',
                'em',
                'code',
                'del',
                'u',
                'a',
                'mark',
                'br',
              ].includes(child.tagName)
            ) ||
              o.node.children
                .map(child => child.type)
                .every(type => type === 'text'))
          ) {
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
                      delta: this._hastToDelta(o.node),
                    },
                  },
                  children: [],
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
              type: 'block',
              id: nanoid(),
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
              type: 'block',
              id: nanoid(),
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
                  type: 'block',
                  id: nanoid(),
                  flavour: 'affine:embed-youtube',
                  props: {
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                  },
                  children: [],
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
          type: 'element',
          tagName: 'span',
          children: [
            {
              type: 'text',
              value: '',
            },
          ],
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

          return [...acc, { content: '\n', color: 'inherit' }, ...cur];
        },
        [] as Omit<ThemedToken, 'offset'>[]
      );
      highlightCache.set(cacheKey, tokens);
    }

    return tokens.map(token => {
      return {
        type: 'element',
        tagName: 'span',
        properties: {
          style: `word-wrap: break-word; color: ${token.color};`,
        },
        children: [
          {
            type: 'text',
            value: token.content,
          },
        ],
      } as ElementContent;
    });
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
            type: 'element',
            tagName: 'strong',
            properties: {},
            children: [hast],
          };
        }
        if (delta.attributes.italic) {
          hast = {
            type: 'element',
            tagName: 'em',
            properties: {},
            children: [hast],
          };
        }
        if (delta.attributes.code) {
          hast = {
            type: 'element',
            tagName: 'code',
            properties: {},
            children: [hast],
          };
        }
        if (delta.attributes.strike) {
          hast = {
            type: 'element',
            tagName: 'del',
            properties: {},
            children: [hast],
          };
        }
        if (delta.attributes.underline) {
          hast = {
            type: 'element',
            tagName: 'u',
            properties: {},
            children: [hast],
          };
        }
        if (delta.attributes.link) {
          hast = {
            type: 'element',
            tagName: 'a',
            properties: {
              href: delta.attributes.link,
            },
            children: [hast],
          };
        }
      }
      return hast;
    });
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
          case 'span': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false })
            );
          }
          case 'strong': {
            return ast.children.flatMap(child =>
              this._hastToDeltaSpreaded(child, { trim: false }).map(delta => {
                delta.attributes = { ...delta.attributes, bold: true };
                return delta;
              })
            );
          }
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

  private _hastToDelta = (
    ast: HtmlAST,
    option: {
      trim?: boolean;
      pageMap?: Map<string, string>;
    } = { trim: true }
  ): DeltaInsert<object>[] => {
    return this._hastToDeltaSpreaded(ast, option).reduce((acc, cur) => {
      return mergeDeltas(acc, cur);
    }, [] as DeltaInsert<object>[]);
  };

  override async fromDocSnapshot(
    payload: FromDocSnapshotPayload
  ): Promise<FromDocSnapshotResult<string>> {
    const { file, assetsIds } = await this.fromBlockSnapshot({
      snapshot: payload.snapshot.blocks,
      assets: payload.assets,
    });
    return {
      file: file.replace(
        '<!--BlockSuiteDocTitlePlaceholder-->',
        `<h1>${payload.snapshot.meta.title}</h1>`
      ),
      assetsIds,
    };
  }

  override async fromBlockSnapshot(
    payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    const root: Root = {
      type: 'root',
      children: [
        {
          type: 'doctype',
        },
      ],
    };
    const { ast, assetsIds } = await this._traverseSnapshot(
      payload.snapshot,
      root,
      payload.assets
    );
    return {
      file: this._astToHtml(ast),
      assetsIds,
    };
  }

  override async fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    let buffer = '';
    const sliceAssetsIds: string[] = [];
    for (const contentSlice of payload.snapshot.content) {
      const root: Root = {
        type: 'root',
        children: [],
      };
      const { ast, assetsIds } = await this._traverseSnapshot(
        contentSlice,
        root,
        payload.assets
      );
      sliceAssetsIds.push(...assetsIds);
      buffer += this._astToHtml(ast);
    }
    const html = buffer;
    return {
      file: html,
      assetsIds: sliceAssetsIds,
    };
  }

  override async toDocSnapshot(
    payload: ToDocSnapshotPayload<string>
  ): Promise<DocSnapshot> {
    const htmlAst = this._htmlToAst(payload.file);
    const titleAst = hastQuerySelector(htmlAst, 'title');
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
          await this._traverseHtml(
            htmlAst,
            blockSnapshotRoot as BlockSnapshot,
            payload.assets
          ),
        ],
      },
    };
  }

  override toBlockSnapshot(
    payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    const htmlAst = this._htmlToAst(payload.file);
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
    return this._traverseHtml(
      htmlAst,
      blockSnapshotRoot as BlockSnapshot,
      payload.assets
    );
  }

  override async toSliceSnapshot(
    payload: HtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot | null> {
    const htmlAst = this._htmlToAst(payload.file);
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
    const contentSlice = (await this._traverseHtml(
      htmlAst,
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
