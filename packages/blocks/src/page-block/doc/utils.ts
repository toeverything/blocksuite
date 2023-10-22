import type { BaseBlockModel } from '@blocksuite/store';

import { toast } from '../../_common/components/toast.js';
import { type SerializedBlock } from '../../_common/utils/index.js';
import { copyBlocks } from '../../_legacy/clipboard/index.js';
import type { CodeBlockModel } from '../../code-block/index.js';

function getTextDelta(model: BaseBlockModel) {
  if (!model.text) {
    return [];
  }
  return model.text.toDelta();
}

// TODO merge with copy-cut-manager
export async function copyBlock(model: BaseBlockModel) {
  const copyType = 'blocksuite/x-c+w';
  const delta = getTextDelta(model);
  const copyData: { data: SerializedBlock[] } = {
    data: [
      {
        type: (model as BaseBlockModel & { type: string }).type,
        flavour: model.flavour,
        sourceId: (model as BaseBlockModel & { sourceId: string }).sourceId,
        text: delta,
        children: [],
      },
    ],
  };
  const copySuccess = performNativeCopy([
    { mimeType: copyType, data: JSON.stringify(copyData) },
    { mimeType: 'text/plain', data: model.text?.toString() || '' },
  ]);
  return copySuccess;
}

interface ClipboardItem {
  mimeType: string;
  data: string;
}

function performNativeCopy(items: ClipboardItem[]): boolean {
  let success = false;
  const tempElem = document.createElement('textarea');
  tempElem.value = 'temp';
  document.body.appendChild(tempElem);
  tempElem.select();
  tempElem.setSelectionRange(0, tempElem.value.length);

  const listener = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      items.forEach(item => clipboardData.setData(item.mimeType, item.data));
    }

    e.preventDefault();
    e.stopPropagation();
    tempElem.removeEventListener('copy', listener);
  };

  tempElem.addEventListener('copy', listener);
  try {
    success = document.execCommand('copy');
  } finally {
    tempElem.removeEventListener('copy', listener);
    document.body.removeChild(tempElem);
  }
  return success;
}

export async function copyCode(codeBlockModel: CodeBlockModel) {
  await copyBlocks([codeBlockModel]);

  toast('Copied to clipboard');
}

export function getAllowSelectedBlocks(
  model: BaseBlockModel
): BaseBlockModel[] {
  const result: BaseBlockModel[] = [];
  const blocks = model.children.slice();

  const dfs = (blocks: BaseBlockModel[]) => {
    for (const block of blocks) {
      if (block.flavour !== 'affine:note') {
        result.push(block);
      }
      block.children.length && dfs(block.children);
    }
  };

  dfs(blocks);
  return result;
}
