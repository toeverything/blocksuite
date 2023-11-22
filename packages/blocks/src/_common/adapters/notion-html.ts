import type {
  FromBlockSnapshotPayload,
  FromBlockSnapshotResult,
  FromPageSnapshotPayload,
  FromPageSnapshotResult,
  FromSliceSnapshotPayload,
  FromSliceSnapshotResult,
  ToBlockSnapshotPayload,
  ToPageSnapshotPayload,
  ToSliceSnapshotPayload,
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

import { getFilenameFromContentDisposition } from '../utils/header-value-parser.js';
import { hastGetTextContent, hastQuerySelector, type HtmlAST } from './hast.js';

export type NotionHtml = string;

export class NotionHtmlAdapter extends BaseAdapter<NotionHtml> {
  override fromPageSnapshot(
    payload: FromPageSnapshotPayload
  ): Promise<FromPageSnapshotResult<string>> {
    throw new Error('Method not implemented.');
  }
  override fromBlockSnapshot(
    payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    throw new Error('Method not implemented.');
  }
  override fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    throw new Error('Method not implemented.');
  }
  override toPageSnapshot(
    payload: ToPageSnapshotPayload<string>
  ): Promise<PageSnapshot> {
    throw new Error('Method not implemented.');
  }
  override toBlockSnapshot(
    payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new Error('Method not implemented.');
  }
  override toSliceSnapshot(
    payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    throw new Error('Method not implemented.');
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
        case 'pre': {
          if (
            o.node.children.length !== 1 ||
            o.node.children[0].type !== 'element' ||
            o.node.children[0].tagName !== 'code'
          ) {
            break;
          }
          const codeText =
            o.node.children[0].children.length === 1 &&
            o.node.children[0].children[0].type === 'text'
              ? o.node.children[0].children[0]
              : o.node.children[0];
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
                    delta: this._hastToDelta(codeText),
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
        case 'p': {
          context.openNode(
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
          context.openNode(
            {
              type: 'block',
              id: nanoid('block'),
              flavour: 'affine:list',
              props: {
                type: context.getNodeContext('hast:list:type'),
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: this._hastToDelta(o.node),
                },
                checked:
                  context.getNodeContext('hast:list:type') === 'todo'
                    ? o.node.children[0].type === 'element' &&
                      Array.isArray(o.node.children[0].properties?.className) &&
                      o.node.children[0].properties.className.includes(
                        'checkbox-on'
                      )
                    : false,
                collapsed:
                  context.getNodeContext('hast:list:type') === 'toggle'
                    ? o.node.children[0].type === 'element' &&
                      o.node.children[0].tagName === 'details' &&
                      o.node.children[0].properties?.open === true
                    : false,
              },
              children: [],
            },
            'children'
          );
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
              const name =
                getFilenameFromContentDisposition(
                  res.headers.get('Content-Disposition') ?? ''
                ) ??
                imageURL.split('/').at(-1) ??
                'image' + res.headers.get('Content-Type')?.split('/').at(-1) ??
                '.png';
              const file = new File([await res.blob()], name);
              blobId = await sha(await res.arrayBuffer());
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
            context.openNode(
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
            );
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
              blobId = await sha(await res.arrayBuffer());
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
      }
    });
    walker.setLeave(async (o, context) => {
      if (o.node.type !== 'element') {
        return;
      }
      switch (o.node.tagName) {
        case 'div': {
          if (Array.isArray(o.node.properties?.className)) {
            if (o.node.properties.className.includes('indented')) {
              context.closeNode();
            }
          }
          break;
        }
        case 'p': {
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
      }
    });
    walker.walk(html, snapshot);
  };

  private _hastToDelta = (ast: HtmlAST): DeltaInsert<object>[] => {
    switch (ast.type) {
      case 'text': {
        return [{ insert: ast.value }];
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
