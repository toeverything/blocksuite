import type { DeltaInsert } from '@blocksuite/virgo/types';

import type { BlockSnapshot } from '../transformer/type.js';
import {
  BaseAdapter,
  type BlockSnapshotPayload,
  type BlockSnapshotReturn,
  type PageSnapshotPayload,
  type PageSnapshotReturn,
} from './base.js';
import { StringBuilder } from './string-builder.js';

export type Markdown = string;

const markdownConvertableFlavours = [
  'affine:code',
  'affine:paragraph',
  'affine:list',
  'affine:divider',
  'affine:image',
  'affine:database',
];

type TraverseContext = {
  indentDepth: number;
  insideTheLists: boolean;
  numberedListCount: number[];
};

export class MarkdownAdapter extends BaseAdapter<Markdown> {
  private markdownBuffer = new StringBuilder();

  async fromPageSnapshot({ snapshot }: PageSnapshotPayload): Promise<Markdown> {
    const buffer = new StringBuilder();
    buffer.write(`# ${snapshot.meta.title}\n`);
    buffer.write(
      await this.fromBlockSnapshot({
        snapshot: snapshot.blocks,
      })
    );
    return buffer.toString();
  }
  async fromBlockSnapshot({
    snapshot,
  }: BlockSnapshotPayload): Promise<Markdown> {
    this.traverseSnapshot(snapshot, {
      indentDepth: 0,
      insideTheLists: false,
      numberedListCount: [0],
    });
    return this.markdownBuffer.toString();
  }

  traverseSnapshot = (snapshot: BlockSnapshot, context: TraverseContext) => {
    if (markdownConvertableFlavours.includes(snapshot.flavour)) {
      const text =
        (snapshot.props.text as { delta: DeltaInsert[] }) ?? undefined;
      if (context.insideTheLists && snapshot.flavour !== 'affine:list') {
        this.markdownBuffer.write('\n');
        context.insideTheLists = false;
        context.numberedListCount = [0];
      }
      switch (snapshot.flavour) {
        case 'affine:code': {
          this.markdownBuffer.write(`\`\`\`${snapshot.props.language ?? ''}\n`);
          if (
            Array.isArray(text?.delta) &&
            text?.delta.every(delta => typeof delta === 'object')
          ) {
            this.markdownBuffer.write(
              this.deltaToMarkdown(text?.delta as DeltaInsert[])
            );
          }
          this.markdownBuffer.write('\n```\n');
          break;
        }
        case 'affine:paragraph': {
          switch (snapshot.props.type) {
            case 'h1': {
              this.markdownBuffer.write('# ');
              break;
            }
            case 'h2': {
              this.markdownBuffer.write('## ');
              break;
            }
            case 'h3': {
              this.markdownBuffer.write('### ');
              break;
            }
            case 'h4': {
              this.markdownBuffer.write('#### ');
              break;
            }
            case 'h5': {
              this.markdownBuffer.write('##### ');
              break;
            }
            case 'h6': {
              this.markdownBuffer.write('###### ');
              break;
            }
            case 'text': {
              break;
            }
            case 'quote': {
              this.markdownBuffer.write('> ');
              break;
            }
          }
          if (
            Array.isArray(text?.delta) &&
            text?.delta.every(delta => typeof delta === 'object')
          ) {
            this.markdownBuffer.write(
              this.deltaToMarkdown(text?.delta as DeltaInsert[])
            );
          }
          this.markdownBuffer.write('\n\n');
          for (const child of snapshot.children) {
            context.indentDepth += 1;
            this.markdownBuffer.write('    '.repeat(context.indentDepth));
            this.traverseSnapshot(child, context);
            context.indentDepth -= 1;
          }
          break;
        }
        case 'affine:list': {
          if (snapshot.props.type === 'numbered') {
            console.log(context.numberedListCount);
            const order = (context.numberedListCount.pop() ?? 0) + 1;
            this.markdownBuffer.write(`${order}. `);
            context.numberedListCount.push(order);
            console.log(context.numberedListCount);
          } else if (snapshot.props.type === 'checkbox') {
            this.markdownBuffer.write(
              snapshot.props.checked ? '- [x] ' : '- [ ] '
            );
          } else {
            this.markdownBuffer.write('- ');
          }
          if (
            Array.isArray(text?.delta) &&
            text?.delta.every(delta => typeof delta === 'object')
          ) {
            this.markdownBuffer.write(
              this.deltaToMarkdown(text?.delta as DeltaInsert[])
            );
          }
          this.markdownBuffer.write('\n');
          context.insideTheLists = true;
          context.numberedListCount.push(0);
          for (const child of snapshot.children) {
            context.indentDepth += 1;
            this.markdownBuffer.write('    '.repeat(context.indentDepth));
            this.traverseSnapshot(child, context);
            context.indentDepth -= 1;
          }
          context.numberedListCount.pop();
          break;
        }
        case 'affine:divider': {
          this.markdownBuffer.write('---\n');
          break;
        }
        case 'affine:image': {
          break;
        }
        case 'affine:database': {
          break;
        }
      }
    } else {
      for (const child of snapshot.children) {
        this.traverseSnapshot(child, context);
      }
    }
  };

  async toPageSnapshot(_file: Markdown): Promise<PageSnapshotReturn> {
    throw new Error('Method not implemented.');
  }
  async toBlockSnapshot(_file: Markdown): Promise<BlockSnapshotReturn> {
    throw new Error('Method not implemented.');
  }

  escapeMarkdown(text: string) {
    // FIXME: this is not a complete list of characters that need to be escaped
    return text.replace(/([\\`*])/g, '\\$1');
  }

  deltaToMarkdown(deltas: DeltaInsert[]) {
    const buffer = new StringBuilder();
    for (const delta of deltas) {
      const escapedText = this.escapeMarkdown(delta.insert);
      if (delta.attributes?.bold && delta.attributes?.italic) {
        buffer.write(`***${escapedText}***`);
      } else if (delta.attributes?.bold) {
        buffer.write(`**${escapedText}**`);
      } else if (delta.attributes?.italic) {
        buffer.write(`*${escapedText}*`);
      } else if (delta.attributes?.underline) {
        buffer.write(`${escapedText}`);
      } else if (delta.attributes?.strike) {
        buffer.write(`~~${escapedText}~~`);
      } else if (delta.attributes?.code) {
        buffer.write(`\`${escapedText}\``);
      } else if (delta.attributes?.link) {
        buffer.write(`[${escapedText}](${delta.attributes.link})`);
      } else {
        buffer.write(`${escapedText}`);
      }
    }
    return buffer.toString();
  }
}
