import type { DeltaInsert } from '@blocksuite/virgo/types';
import type { Heading, Root, RootContentMap } from 'mdast';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

import {
  type BlockSnapshot,
  BlockSnapshotSchema,
  type PageSnapshot,
  type SliceSnapshot,
} from '../transformer/type.js';
import { nanoid } from '../utils/id-generator.js';
import type { AdapterAssetsManager } from './assets.js';
import type {
  FromSliceSnapshotPayload,
  ToBlockSnapshotPayload,
  ToPageSnapshotPayload,
  ToSliceSnapshotPayload,
} from './base.js';
import {
  ASTWalker,
  BaseAdapter,
  type FromBlockSnapshotPayload,
  type FromPageSnapshotPayload,
} from './base.js';
import { StringBuilder } from './string-builder.js';

export type Markdown = string;

type MdastUnionType<
  K extends keyof RootContentMap,
  V extends RootContentMap[K],
> = V;

type MarkdownAST =
  | MdastUnionType<keyof RootContentMap, RootContentMap[keyof RootContentMap]>
  | Root;

export class MarkdownAdapter extends BaseAdapter<Markdown> {
  private markdownBuffer = new StringBuilder();

  async fromPageSnapshot({
    snapshot,
    assets,
  }: FromPageSnapshotPayload): Promise<Markdown> {
    const buffer = new StringBuilder();
    buffer.write(`# ${snapshot.meta.title}\n`);
    buffer.write(
      await this.fromBlockSnapshot({
        snapshot: snapshot.blocks,
        assets,
      })
    );
    return buffer.toString();
  }

  async fromBlockSnapshot({
    snapshot,
    assets,
  }: FromBlockSnapshotPayload): Promise<Markdown> {
    const root: Root = {
      type: 'root',
      children: [],
    };
    const ast = await this.traverseSnapshot(snapshot, root, assets);
    this.markdownBuffer.write(this.astToMardown(ast));
    const markdown = this.markdownBuffer.toString();
    this.markdownBuffer.clear();
    return markdown;
  }

  async fromSliceSnapshot({
    snapshot,
    assets,
  }: FromSliceSnapshotPayload): Promise<Markdown> {
    for (const contentSlice of snapshot.content) {
      const root: Root = {
        type: 'root',
        children: [],
      };
      const ast = await this.traverseSnapshot(contentSlice, root, assets);
      this.markdownBuffer.write(this.astToMardown(ast));
      this.markdownBuffer.write('\n\n');
    }
    const markdown = this.markdownBuffer.toString();
    this.markdownBuffer.clear();
    return markdown;
  }

  async toPageSnapshot(
    _payload: ToPageSnapshotPayload<Markdown>
  ): Promise<PageSnapshot> {
    throw new Error('Method not implemented.');
  }

  async toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<Markdown>
  ): Promise<BlockSnapshot> {
    throw new Error('Method not implemented.');
  }

  async toSliceSnapshot(
    _payload: ToSliceSnapshotPayload<Markdown>
  ): Promise<SliceSnapshot> {
    throw new Error('Method not implemented.');
  }

  traverseSnapshot = async (
    snapshot: BlockSnapshot,
    markdown: MarkdownAST,
    assets?: AdapterAssetsManager
  ) => {
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
                    children: this.deltaToMdAST(text.delta, paragraphDepth),
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
                    children: this.deltaToMdAST(text.delta, paragraphDepth),
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
                    children: this.deltaToMdAST(text.delta),
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
                  children: this.deltaToMdAST(text.delta),
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
                  children: this.deltaToMdAST(text.delta),
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
          const blobId = (snapshot.props.sourceId ?? '') as string;
          await assets?.readFromBlob(blobId);
          const blob = assets?.getAssets().get(blobId);
          if (!blob) {
            break;
          }
          const dataURL = await blobToDataURL(blob);
          context
            .openNode(
              {
                type: 'image',
                url: dataURL as string,
                title: null,
                alt: null,
              },
              'children'
            )
            .closeNode();
          break;
        }
      }
    });
    walker.setLeave(async (o, context) => {
      const currentTNode = context.currentNode();
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
            context.getNodeContext('affine:list:parent') === o.parent &&
            currentTNode.type === 'list' &&
            currentTNode.ordered === (o.node.props.type === 'numbered') &&
            currentTNode.children[0].checked ===
              (o.node.props.type === 'todo'
                ? (o.node.props.checked as boolean)
                : undefined)
          ) {
            context.closeNode();
          } else {
            context.closeNode().closeNode();
          }
          break;
        }
      }
    });
    return (await walker.walk(snapshot, markdown)) as Root;
  };

  tranverseMarkdown = (markdown: MarkdownAST, snapshot: BlockSnapshot) => {
    const walker = new ASTWalker<MarkdownAST, BlockSnapshot>();
    walker.setONodeTypeGuard(
      (node): node is MarkdownAST =>
        'type' in (node as object) && (node as MarkdownAST).type !== undefined
    );
    walker.setEnter(async (o, context) => {
      switch (o.node.type) {
        case 'paragraph': {
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
                    delta: this.mdastToDelta(o.node),
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
                id: nanoid('block'),
                flavour: 'affine:paragraph',
                props: {
                  type: `h${o.node.depth}`,
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: this.mdastToDelta(o.node),
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
                id: nanoid('block'),
                flavour: 'affine:paragraph',
                props: {
                  type: 'quote',
                  text: {
                    '$blocksuite:internal:text$': true,
                    delta: o.node.children.map(child =>
                      this.mdastToDelta(child)
                    ),
                  },
                },
                children: [],
              },
              'children'
            )
            .closeNode();
          context.skip();
          break;
        }
        case 'list': {
          context.setNodeContext('mdast:list:ordered', o.node.ordered);
          break;
        }
        case 'listItem': {
          context
            .openNode(
              {
                type: 'block',
                id: nanoid('block'),
                flavour: 'affine:list',
                props: {
                  type: context.getNodeContext('mdast:list:ordered')
                    ? 'numbered'
                    : 'bulleted',
                  checked: o.node.checked,
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
    return walker.walk(markdown, snapshot);
  };

  astToMardown(ast: Root) {
    return unified().use(remarkStringify).stringify(ast);
  }

  markdownToAst(markdown: Markdown) {
    return unified().use(remarkParse).parse(markdown);
  }

  deltaToMdAST(deltas: DeltaInsert[], depth = 0) {
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
        mdast = {
          type: 'link',
          url: delta.attributes.link,
          children: [mdast],
        };
      }
      return mdast;
    });
  }

  mdastToDelta(ast: MarkdownAST): DeltaInsert[] {
    switch (ast.type) {
      case 'text': {
        return [{ insert: ast.value }];
      }
      case 'inlineCode': {
        return [{ insert: ast.value, attributes: { code: true } }];
      }
      case 'strong': {
        return ast.children.flatMap(child =>
          this.mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, bold: true };
            return delta;
          })
        );
      }
      case 'emphasis': {
        return ast.children.flatMap(child =>
          this.mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, italic: true };
            return delta;
          })
        );
      }
      case 'delete': {
        return ast.children.flatMap(child =>
          this.mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, strike: true };
            return delta;
          })
        );
      }
      case 'link': {
        return ast.children.flatMap(child =>
          this.mdastToDelta(child).map(delta => {
            delta.attributes = { ...delta.attributes, link: ast.url };
            return delta;
          })
        );
      }
    }
    return 'children' in ast
      ? ast.children.flatMap(child => this.mdastToDelta(child))
      : [];
  }
}

function blobToDataURL(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
