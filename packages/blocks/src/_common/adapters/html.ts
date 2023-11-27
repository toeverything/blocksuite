import { assertEquals } from '@blocksuite/global/utils';
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
import {
  type AssetsManager,
  BlockSnapshotSchema,
  getAssetName,
} from '@blocksuite/store';
import { ASTWalker, BaseAdapter } from '@blocksuite/store';
import {
  type BlockSnapshot,
  type PageSnapshot,
  type SliceSnapshot,
} from '@blocksuite/store';
import type { DeltaInsert } from '@blocksuite/virgo';
import type { ElementContent, Root, Text } from 'hast';
import rehypeStringify from 'rehype-stringify';
import { getHighlighter, type IThemedToken, type Lang } from 'shiki';
import { unified } from 'unified';

import { LIGHT_THEME } from '../../code-block/utils/consts.js';
import {
  highlightCache,
  type highlightCacheKey,
} from '../../code-block/utils/highlight-cache.js';
import { type HtmlAST } from './hast.js';

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
  override async fromPageSnapshot(
    payload: FromPageSnapshotPayload
  ): Promise<FromPageSnapshotResult<string>> {
    const { file, assetsIds } = await this.fromBlockSnapshot({
      snapshot: payload.snapshot.blocks,
      assets: payload.assets,
    });
    return {
      file,
      assetsIds,
    };
  }
  override async fromBlockSnapshot(
    payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    const root: Root = {
      type: 'root',
      children: [],
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
  override async toPageSnapshot(
    _payload: ToPageSnapshotPayload<string>
  ): Promise<PageSnapshot> {
    throw new Error('Method not implemented.');
  }
  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new Error('Method not implemented.');
  }
  override async toSliceSnapshot(
    _payload: HtmlToSliceSnapshotPayload
  ): Promise<SliceSnapshot> {
    throw new Error('Method not implemented.');
  }

  private _astToHtml = (ast: Root) => {
    return unified().use(rehypeStringify).stringify(ast);
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
                `,
              },
              'children'
            )
            .closeNode()
            .closeNode()
            .closeNode();
          break;
        }
        case 'affine:code': {
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
                children: await this._deltaToHigglightHasts(
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
    walker.setLeave(async (o, context) => {
      switch (o.node.flavour) {
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

  private _deltaToHigglightHasts = async (
    deltas: DeltaInsert[],
    rawLang: unknown
  ) => {
    assertEquals(deltas.length, 1);
    const delta = deltas[0];
    if (rawLang === 'Plain Text' || rawLang === 'Text' || !rawLang) {
      return [
        {
          type: 'text',
          value: delta.insert,
        } as Text,
      ];
    }
    const lang = rawLang as Lang;
    const highlighter = await getHighlighter({
      theme: LIGHT_THEME,
      themes: [LIGHT_THEME],
      langs: [lang],
      paths: {
        // TODO: use local path
        wasm: 'https://cdn.jsdelivr.net/npm/shiki/dist',
        themes: 'https://cdn.jsdelivr.net/',
        languages: 'https://cdn.jsdelivr.net/npm/shiki/languages',
      },
    });
    const cacheKey: highlightCacheKey = `${delta.insert}-${rawLang}-light`;
    const cache = highlightCache.get(cacheKey);

    let tokens: IThemedToken[] = [
      {
        content: delta.insert,
      },
    ];
    if (cache) {
      tokens = cache;
    } else {
      tokens = highlighter.codeToThemedTokens(
        delta.insert,
        lang,
        LIGHT_THEME
      )[0];
      highlightCache.set(cacheKey, tokens);
    }

    return tokens.map(token => {
      return {
        type: 'element',
        tagName: 'span',
        properties: {
          styles: `word-wrap: break-word; color: ${token.color};`,
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

  private _deltaToHast = (deltas: DeltaInsert[]) => {
    return deltas.map(delta => {
      let hast: HtmlAST = {
        type: 'text',
        value: delta.insert,
      };
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
}
