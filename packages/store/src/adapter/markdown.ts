import type { DeltaInsert } from '@blocksuite/virgo/types';

import type {
  BlockSnapshot,
  PageSnapshot,
  SliceSnapshot,
} from '../transformer/type.js';
import type { AdapterAssetsManager } from './assets.js';
import type {
  FromSliceSnapshotPayload,
  ToBlockSnapshotPayload,
  ToPageSnapshotPayload,
  ToSliceSnapshotPayload,
} from './base.js';
import {
  BaseAdapter,
  type FromBlockSnapshotPayload,
  type FromPageSnapshotPayload,
} from './base.js';
import { StringBuilder } from './string-builder.js';

export type Markdown = string;

const markdownConvertibleFlavours = [
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

  async fromSliceSnapshot({
    snapshot,
    assets,
  }: FromSliceSnapshotPayload): Promise<Markdown> {
    for (const contentSlice of snapshot.content) {
      await this.traverseSnapshot(contentSlice, {
        indentDepth: 0,
        insideTheLists: false,
        numberedListCount: [0],
        assets,
      });
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

  private traverseSnapshot = async (
    snapshot: BlockSnapshot,
    context: TraverseContext
  ) => {
    if (!markdownConvertibleFlavours.includes(snapshot.flavour)) {
      for (const child of snapshot.children) {
        await this.traverseSnapshot(child, context);
      }
      return;
    }
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
    // https://spec.commonmark.org/0.30/#backslash-escapes
    // Remove comma for better compatibility.
    return text.replace(/([!"#$%&'()*+\-./:;<=>?@[\\\]^_`{|}~])/g, '\\$1');
  }

  deltaToMarkdown(deltas: DeltaInsert[]) {
    const buffer = new StringBuilder();
    for (const delta of deltas) {
      let markdownText = delta.attributes?.code
        ? delta.insert
        : this.escapeMarkdown(delta.insert);
      if (delta.attributes?.code) {
        markdownText = `\`${markdownText}\``;
      }
      if (delta.attributes?.bold) {
        markdownText = `**${markdownText}**`;
      }
      if (delta.attributes?.italic) {
        markdownText = `*${markdownText}*`;
      }
      if (delta.attributes?.underline) {
        markdownText = `<u>${markdownText}</u>`;
      }
      if (delta.attributes?.strike) {
        markdownText = `~~${markdownText}~~`;
      }
      if (delta.attributes?.link) {
        markdownText = `[${markdownText}](${delta.attributes.link})`;
      }
      buffer.write(markdownText);
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
