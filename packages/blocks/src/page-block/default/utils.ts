import type { BaseBlockModel } from '@blocksuite/store';
import {
  assertExists,
  BLOCK_ID_ATTR,
  getBlockById,
  getBlockElementByModel,
  getRichTextByModel,
  matchFlavours,
  resetNativeSelection,
} from '../../__internal__/utils';
import { toast } from '../../components/toast';
import type { EmbedOption } from './default-page-block';

export const getHoverBlockOptionByPosition = (
  blocks: BaseBlockModel[],
  x: number,
  y: number,
  flavours: string[],
  targetSelector: string
) => {
  while (blocks.length) {
    const blockModel = blocks.shift();
    assertExists(blockModel);
    blockModel.children && blocks.push(...blockModel.children);
    if (matchFlavours(blockModel, flavours)) {
      const hoverDom = getBlockById(blockModel.id);
      const hoverTarget = hoverDom?.querySelector(targetSelector);
      const imageRect = hoverTarget?.getBoundingClientRect();
      assertExists(imageRect);
      if (isPointIn(imageRect, x, y)) {
        return {
          position: {
            x: imageRect.right + 10,
            y: imageRect.top,
          },
          model: blockModel,
        };
      }
    }
  }
  return null;
};

function isPointIn(block: DOMRect, x: number, y: number): boolean {
  if (
    x < block.left ||
    x > block.left + block.width + 50 ||
    y < block.top ||
    // when block height is smaller than height of option menu, need a stricter value to prevent bar disappear
    y > block.top + Math.max(block.height, 120)
  ) {
    return false;
  }
  return true;
}

export function downloadImage(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.download = 'test';
  link.click();
  document.body.removeChild(link);
  link.remove();
}

export async function copyImgToClip(imgURL: string) {
  const data = await fetch(imgURL);
  const blob = await data.blob();
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);
}

export function focusCaption(model: BaseBlockModel) {
  const dom = getBlockElementByModel(model)?.querySelector(
    '.affine-embed-wrapper-caption'
  ) as HTMLInputElement;
  dom.focus();
}

function removeCodeBlockOptionMenu() {
  document.querySelector(`.affine-codeblock-option-container`)?.remove();
}

export function copyCode(codeBlockOption: EmbedOption) {
  const richText = getRichTextByModel(codeBlockOption.model);
  assertExists(richText);
  const quill = richText?.quill;
  quill.setSelection(0, quill.getLength());
  document.dispatchEvent(new ClipboardEvent('copy'));
  resetNativeSelection(null);
  toast('Copied to clipboard');
  removeCodeBlockOptionMenu();
}

export function deleteCodeBlock(codeBlockOption: EmbedOption) {
  const model = codeBlockOption.model;
  model.page.deleteBlock(model);
  removeCodeBlockOptionMenu();
}

export function toggleWrap(codeBlockOption: EmbedOption) {
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${codeBlockOption.model.id}"] .ql-syntax`
  );
  assertExists(syntaxElem);
  syntaxElem.classList.toggle('wrap');
  removeCodeBlockOptionMenu();
}
