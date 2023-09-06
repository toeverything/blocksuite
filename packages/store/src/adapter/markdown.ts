import type { DeltaInsert } from '@blocksuite/virgo/types';

import type { BlockSnapshot } from '../transformer/type.js';
import {
  BaseAdapter,
  type BlockSnapshotPayload,
  type BlockSnapshotReturn,
  type PageSnapshotPayload,
  type PageSnapshotReturn,
} from './base.js';

export type Markdown = string;

const markdownConvertableFlavours = [
  'affine:code',
  'affine:paragraph',
  'affine:list',
  'affine:divider',
  'affine:image',
  'affine:database',
];

export class MarkdownAdapter extends BaseAdapter<Markdown> {
  async convertPageSnapshotToAdapterTarget({
    snapshot,
  }: PageSnapshotPayload): Promise<Markdown> {
    let buffer = '';
    buffer += `# ${snapshot.meta.page.title}\n`;
    buffer += await this.convertBlockSnapshotToAdapterTarget({
      snapshot: snapshot.block,
    });
    return buffer.toString();
  }
  async convertBlockSnapshotToAdapterTarget({
    snapshot,
  }: BlockSnapshotPayload): Promise<Markdown> {
    let buffer = '';
    const traverseSnapshot = (snapshot: BlockSnapshot) => {
      if (markdownConvertableFlavours.includes(snapshot.flavour)) {
        const text =
          (snapshot.props.text as { delta: DeltaInsert[] }) ?? undefined;
        switch (snapshot.flavour) {
          case 'affine:code': {
            buffer += `\`\`\`${snapshot.props.language ?? ''}\n`;
            if (
              Array.isArray(text?.delta) &&
              text?.delta.every(delta => typeof delta === 'object')
            ) {
              buffer += this.deltaToMarkdown(text?.delta as DeltaInsert[]);
            }
            buffer += '\n```\n';
            break;
          }
          case 'affine:paragraph': {
            switch (snapshot.props.type) {
              case 'h1': {
                buffer += '# ';
                break;
              }
              case 'h2': {
                buffer += '## ';
                break;
              }
              case 'h3': {
                buffer += '### ';
                break;
              }
              case 'h4': {
                buffer += '#### ';
                break;
              }
              case 'h5': {
                buffer += '##### ';
                break;
              }
              case 'h6': {
                buffer += '###### ';
                break;
              }
              case 'text': {
                break;
              }
              case 'quote': {
                buffer += '> ';
                break;
              }
            }
            if (
              Array.isArray(text?.delta) &&
              text?.delta.every(delta => typeof delta === 'object')
            ) {
              buffer += this.deltaToMarkdown(text?.delta as DeltaInsert[]);
            }
            buffer += '\n\n';
            break;
          }
          case 'affine:list': {
            buffer += '- ';
            if (
              Array.isArray(text?.delta) &&
              text?.delta.every(delta => typeof delta === 'object')
            ) {
              buffer += this.deltaToMarkdown(text?.delta as DeltaInsert[]);
            }
            buffer += '\n';
            break;
          }
          case 'affine:divider': {
            buffer += '---\n';
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
          traverseSnapshot(child);
        }
      }
    };
    traverseSnapshot(snapshot);
    return buffer;
  }
  async convertAdapterTargetToPageSnapshot(
    _file: Markdown
  ): Promise<PageSnapshotReturn> {
    throw new Error('Method not implemented.');
  }
  async convertAdapterTargetToBlockSnapshot(
    _file: Markdown
  ): Promise<BlockSnapshotReturn> {
    throw new Error('Method not implemented.');
  }

  escapeMarkdown(text: string) {
    // FIXME: this is not a complete list of characters that need to be escaped
    return text.replace(/([\\`*])/g, '\\$1');
  }

  deltaToMarkdown(deltas: DeltaInsert[]) {
    let buffer = '';
    for (const delta of deltas) {
      const escapedText = this.escapeMarkdown(delta.insert);
      if (delta.attributes?.bold && delta.attributes?.italic) {
        buffer += `***${escapedText}***`;
      } else if (delta.attributes?.bold) {
        buffer += `**${escapedText}**`;
      } else if (delta.attributes?.italic) {
        buffer += `*${escapedText}*`;
      } else if (delta.attributes?.underline) {
        buffer += `${escapedText}`;
      } else if (delta.attributes?.strike) {
        buffer += `~~${escapedText}~~`;
      } else if (delta.attributes?.code) {
        buffer += `\`${escapedText}\``;
      } else if (delta.attributes?.link) {
        buffer += `[${escapedText}](${delta.attributes.link})`;
      } else {
        buffer += `${escapedText}`;
      }
    }
    return buffer.toString();
  }
}
