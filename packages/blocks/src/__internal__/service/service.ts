import type { TextRangePoint } from '@blocksuite/block-std';
import type { BaseBlockModel, DeltaOperation } from '@blocksuite/store';
import { Buffer } from 'buffer';
import type { TemplateResult } from 'lit';
import type { TemplateResultType } from 'lit/directive-helpers.js';

import type { BlockTransformContext, SerializedBlock } from '../utils/index.js';
import { json2block } from './json2block.js';

// Breaking change introduced in lit@2.8.0
// https://github.com/lit/lit/pull/3993
const isTemplateResult = (
  value: unknown,
  type?: TemplateResultType
): value is TemplateResult =>
  type === undefined
    ? // This property needs to remain unminified.
      (value as TemplateResult)?.['_$litType$'] !== undefined
    : (value as TemplateResult)?.['_$litType$'] === type;

export class BaseService<BlockModel extends BaseBlockModel = BaseBlockModel> {
  templateResult2String(temp: TemplateResult): string {
    const values = [...temp.values, ''].map(value => {
      if (isTemplateResult(value)) {
        return this.templateResult2String(value);
      } else {
        return value;
      }
    });
    return temp.strings.reduce(
      (result, str, i) => result + str + values[i],
      ''
    );
  }

  async block2html(
    block: BlockModel,
    { childText = '', begin, end }: BlockTransformContext = {},
    _blobMap?: Map<string, string>
  ): Promise<string> {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    const text = delta.reduce((html: string, item: DeltaOperation) => {
      return html + BaseService.deltaLeaf2Html(block, item);
    }, '');
    return `${text}${childText}`;
  }

  block2Text(
    block: BlockModel,
    { childText = '', begin = 0, end }: BlockTransformContext = {}
  ): string {
    const text = (block.text?.toString() || '').slice(begin, end);
    return `${text}${childText}`;
  }

  async block2markdown(
    block: BlockModel,
    { childText = '', begin, end }: BlockTransformContext = {},
    _blobMap?: Map<string, string>
  ): Promise<string> {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    const text = delta.reduce((markdown: string, item: DeltaOperation) => {
      return markdown + BaseService.deltaLeaf2markdown(block, item);
    }, '');
    return `${text}\r\n\r\n${childText}`;
  }

  block2Json(
    block: BlockModel,
    children: SerializedBlock[],
    begin?: number,
    end?: number
  ): SerializedBlock {
    const delta = block.text?.sliceToDelta(begin ?? 0, end) ?? [];
    return {
      flavour: block.flavour,
      type: (block as BlockModel & { type: string }).type as string,
      text: delta,
      children,
    };
  }

  // json2block is triggered when paste behavior occurs(now),
  // at this time cursor is focus on one block, and is must a caret in this block(since selection has been handled in paste callback)
  // this is the common handler for most block, but like code block, it should be overridden this
  async json2Block(
    focusedBlockModel: BlockModel,
    pastedBlocks: SerializedBlock[],
    textRangePoint?: TextRangePoint
  ) {
    return json2block(focusedBlockModel, pastedBlocks, { textRangePoint });
  }

  async onBlockPasted(
    _model: BlockModel,
    _clipboardData: Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {}

  private static deltaLeaf2Html(
    block: BaseBlockModel,
    deltaLeaf: DeltaOperation
  ) {
    let text = deltaLeaf.insert ?? '';
    // replace unsafe characters
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const attributes = deltaLeaf.attributes;
    if (!attributes) {
      return text;
    }
    if (attributes.code) {
      text = `<code>${text}</code>`;
    }
    if (attributes.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (attributes.italic) {
      text = `<em>${text}</em>`;
    }
    if (attributes.underline) {
      text = `<u>${text}</u>`;
    }
    if (attributes.strike || attributes.strikethrough) {
      text = `<s>${text}</s>`;
    }
    if (attributes.link) {
      text = `<a href="${attributes.link}">${text}</a>`;
    }
    if (attributes.reference) {
      const refPageId = attributes.reference.pageId;
      const workspace = block.page.workspace;
      const pageMeta = workspace.meta.pageMetas.find(
        page => page.id === refPageId
      );
      const host = window.location.origin;
      // maybe should use public link at here?
      const referenceLink = `${host}/workspace/${workspace.id}/${refPageId}`;
      const referenceTitle = pageMeta ? pageMeta.title : 'Deleted page';
      text = `<a href="${referenceLink}">${referenceTitle}</a>`;
    }
    return text;
  }

  private static deltaLeaf2markdown(
    block: BaseBlockModel,
    deltaLeaf: DeltaOperation
  ) {
    let text = deltaLeaf.insert ?? '';
    // replace unsafe characters
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const attributes = deltaLeaf.attributes;
    if (!attributes) {
      return text;
    }
    if (attributes.code) {
      text = '`' + text + '`';
    }
    if (attributes.bold) {
      text = `**${text}**`;
    }
    if (attributes.italic) {
      text = `_${text}_`;
    }
    if (attributes.underline) {
      text = `<u>${text}</u>`;
    }
    if (attributes.strike || attributes.strikethrough) {
      text = `~~${text}~~`;
    }
    if (attributes.link) {
      text = `[${text}](${attributes.link})`;
    }
    if (attributes.reference) {
      const refPageId = attributes.reference.pageId;
      const workspace = block.page.workspace;
      const pageMeta = workspace.meta.pageMetas.find(
        page => page.id === refPageId
      );
      const host = window.location.origin;
      // maybe should use public link at here?
      const referenceLink = `${host}/workspace/${workspace.id}/${refPageId}`;
      const referenceTitle = pageMeta ? pageMeta.title : 'Deleted page';
      text = `[${referenceTitle}](${referenceLink})`;
    }
    return text;
  }

  protected async getBlobType(blob: Blob): Promise<string> {
    if (blob.type) {
      return blob.type;
    }
    // FIXME: this file-type will be removed in future, see https://github.com/toeverything/AFFiNE/issues/3245
    // @ts-ignore
    const FileType = await import('file-type/browser.js');
    if (window.Buffer === undefined) {
      window.Buffer = Buffer;
    }
    const buffer = await blob.arrayBuffer();
    const fileType = await FileType.fromBuffer(buffer);
    return fileType?.mime ?? 'image/png';
  }
}
