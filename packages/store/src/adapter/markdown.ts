import type { DeltaInsert } from '@blocksuite/virgo/types';

import type { BlockSnapshot } from '../transformer/type.js';
import type { AdapterAssetsManager } from './assets.js';
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
  assets?: AdapterAssetsManager;
};

export class MarkdownAdapter extends BaseAdapter<Markdown> {
  private markdownBuffer = new StringBuilder();

  async fromPageSnapshot({
    snapshot,
    assets,
  }: PageSnapshotPayload): Promise<Markdown> {
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
  }: BlockSnapshotPayload): Promise<Markdown> {
    await this.traverseSnapshot(snapshot, {
      indentDepth: 0,
      insideTheLists: false,
      numberedListCount: [0],
      assets,
    });
    const markdown = this.markdownBuffer.toString();
    this.markdownBuffer.clear();
    return markdown;
  }

  async toPageSnapshot(_file: Markdown): Promise<PageSnapshotReturn> {
    throw new Error('Method not implemented.');
  }

  async toBlockSnapshot(_file: Markdown): Promise<BlockSnapshotReturn> {
    throw new Error('Method not implemented.');
  }

  private traverseSnapshot = async (
    snapshot: BlockSnapshot,
    context: TraverseContext
  ) => {
    if (markdownConvertableFlavours.includes(snapshot.flavour)) {
      const text = (snapshot.props.text ?? { delta: [] }) as {
        delta: DeltaInsert[];
      };
      if (context.insideTheLists && snapshot.flavour !== 'affine:list') {
        this.markdownBuffer.write('\n');
        context.insideTheLists = false;
        context.numberedListCount = [0];
      }
      switch (snapshot.flavour) {
        case 'affine:code': {
          this.markdownBuffer.write(`\`\`\`${snapshot.props.language ?? ''}\n`);
          this.writeTextDelta(text);
          this.markdownBuffer.write('\n```\n');
          break;
        }
        case 'affine:paragraph': {
          switch (snapshot.props.type) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6': {
              const level = parseInt(snapshot.props.type[1]);
              this.markdownBuffer.write('#'.repeat(level) + ' ');
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
          this.writeTextDelta(text);
          this.markdownBuffer.write('\n\n');
          for (const child of snapshot.children) {
            context.indentDepth += 1;
            this.markdownBuffer.write('    '.repeat(context.indentDepth));
            await this.traverseSnapshot(child, context);
            context.indentDepth -= 1;
          }
          break;
        }
        case 'affine:list': {
          if (snapshot.props.type === 'numbered') {
            const order = (context.numberedListCount.pop() ?? 0) + 1;
            this.markdownBuffer.write(`${order}. `);
            context.numberedListCount.push(order);
          } else if (snapshot.props.type === 'checkbox') {
            this.markdownBuffer.write(
              snapshot.props.checked ? '- [x] ' : '- [ ] '
            );
          } else {
            this.markdownBuffer.write('- ');
          }
          this.writeTextDelta(text);
          this.markdownBuffer.write('\n');
          context.insideTheLists = true;
          context.numberedListCount.push(0);
          for (const child of snapshot.children) {
            context.indentDepth += 1;
            this.markdownBuffer.write('    '.repeat(context.indentDepth));
            await this.traverseSnapshot(child, context);
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
          const blobId = (snapshot.props.sourceId ?? '') as string;
          await context.assets?.readFromBlob(blobId);
          const blob = context.assets?.getAssets().get(blobId);
          if (!blob) {
            break;
          }
          const dataURL = await blobToDataURL(blob);
          this.markdownBuffer.write(`![](${dataURL})\n`);
          break;
        }
        case 'affine:database': {
          break;
        }
      }
    } else {
      for (const child of snapshot.children) {
        await this.traverseSnapshot(child, context);
      }
    }
  };

  private writeTextDelta(text: { delta: DeltaInsert[] }) {
    if (
      Array.isArray(text?.delta) &&
      text?.delta.every(delta => typeof delta === 'object')
    ) {
      this.markdownBuffer.write(this.deltaToMarkdown(text?.delta));
    }
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

function blobToDataURL(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
