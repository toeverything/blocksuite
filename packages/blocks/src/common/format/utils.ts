import type { BlockElement, BlockSuiteRoot } from '@blocksuite/lit';
import {
  VIRGO_ROOT_ATTR,
  type VirgoRootElement,
  type VRange,
} from '@blocksuite/virgo';

import { BLOCK_ID_ATTR } from '../../__internal__/consts.js';
import type {
  AffineTextAttributes,
  AffineVEditor,
} from '../../components/rich-text/virgo/types.js';
import type { Flavour } from '../../models.js';
import { getSelectedContentBlockElements } from '../../page-block/utils/selection.js';
import {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './config.js';

function getCombinedFormatFromVEditors(
  vEditors: [AffineVEditor, VRange | null][]
): AffineTextAttributes {
  const formatArr: AffineTextAttributes[] = [];
  vEditors.forEach(([vEditor, vRange]) => {
    if (!vRange) return;

    const format = vEditor.getFormat(vRange);
    formatArr.push(format);
  });

  // format will be active only when all vEditors have the same format.
  return formatArr.reduce((acc, cur) => {
    const newFormat: AffineTextAttributes = {};
    for (const key in acc) {
      const typedKey = key as keyof AffineTextAttributes;
      if (acc[typedKey] === cur[typedKey]) {
        // This cast is secure because we have checked that the value of the key is the same.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newFormat[typedKey] = acc[typedKey] as any;
      }
    }
    return newFormat;
  });
}

function getCombinedFormat(root: BlockSuiteRoot): AffineTextAttributes {
  const textSelection = root.selection.find('text');
  const blockSelections = root.selection.filter('block');

  // text selection, corresponding to `formatText` command
  if (textSelection) {
    const selectedElements = getSelectedContentBlockElements(root, [
      'text',
    ]).filter(el =>
      FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour)
    );

    const selectedVEditors = selectedElements.flatMap(el => {
      const vRoot = el.querySelector<VirgoRootElement<AffineTextAttributes>>(
        `[${VIRGO_ROOT_ATTR}]`
      );
      if (vRoot && vRoot.virgoEditor.getVRange()) {
        return vRoot.virgoEditor;
      }
      return [];
    });

    return getCombinedFormatFromVEditors(
      selectedVEditors.map(e => [e, e.getVRange()])
    );
  }

  // block selection, corresponding to `formatBlock` command
  if (blockSelections.length > 0) {
    const selectedElements = getSelectedContentBlockElements(root, [
      'block',
    ]).filter(el =>
      FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour)
    );

    const selectedVEditors = selectedElements.flatMap(el => {
      const vRoot = el.querySelector<VirgoRootElement<AffineTextAttributes>>(
        `[${VIRGO_ROOT_ATTR}]`
      );
      if (vRoot) {
        return vRoot.virgoEditor;
      }
      return [];
    });

    return getCombinedFormatFromVEditors(
      selectedVEditors.map(e => [
        e,
        {
          index: 0,
          length: e.yTextLength,
        },
      ])
    );
  }

  // native selection, corresponding to `formatNative` command
  const selectedVEditors = Array.from<VirgoRootElement>(
    root.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
  )
    .filter(el => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);

      return range.intersectsNode(el);
    })
    .filter(el => {
      const blockElement = el.closest<BlockElement>(`[${BLOCK_ID_ATTR}]`);
      if (blockElement) {
        return FORMAT_NATIVE_SUPPORT_FLAVOURS.includes(
          blockElement.model.flavour as Flavour
        );
      }
      return false;
    })
    .map(el => el.virgoEditor);
  return getCombinedFormatFromVEditors(
    selectedVEditors.map(e => [e, e.getVRange()])
  );
}

export function handleCommonStyle(
  root: BlockSuiteRoot,
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >
) {
  const active = commonActiveWhen(root, key);
  const payload: {
    root: BlockSuiteRoot;
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  } = {
    root,
    styles: {
      [key]: active ? null : true,
    },
  };
  root.std.command
    .pipe()
    .try(chain => [
      chain.formatText(payload),
      chain.formatBlock(payload),
      chain.formatNative(payload),
    ])
    .run();
}

export function commonActiveWhen(root: BlockSuiteRoot, key: string) {
  const format = getCombinedFormat(root);
  return key in format;
}

export function isFormatSupported(root: BlockSuiteRoot) {
  const textSelection = root.selection.find('text');
  const blockSelections = root.selection.filter('block');

  if (textSelection) {
    if (textSelection.isCollapsed()) return false;

    const selectedElements = getSelectedContentBlockElements(root, [
      'text',
    ]).filter(el =>
      FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour)
    );

    const selectedVEditors = selectedElements.flatMap(el => {
      const vRoot = el.querySelector<VirgoRootElement<AffineTextAttributes>>(
        `[${VIRGO_ROOT_ATTR}]`
      );
      if (vRoot && vRoot.virgoEditor.getVRange()) {
        return vRoot.virgoEditor;
      }
      return [];
    });

    return selectedVEditors.length > 0;
  }

  // block selection, corresponding to `formatBlock` command
  if (blockSelections.length > 0) {
    const selectedElements = getSelectedContentBlockElements(root, [
      'block',
    ]).filter(el =>
      FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour)
    );

    const selectedVEditors = selectedElements.flatMap(el => {
      const vRoot = el.querySelector<VirgoRootElement<AffineTextAttributes>>(
        `[${VIRGO_ROOT_ATTR}]`
      );
      if (vRoot) {
        return vRoot.virgoEditor;
      }
      return [];
    });

    return selectedVEditors.length > 0;
  }

  // native selection, corresponding to `formatNative` command
  const selectedVEditors = Array.from<VirgoRootElement>(
    root.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
  )
    .filter(el => {
      const selection = document.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);

      return range.intersectsNode(el);
    })
    .filter(el => {
      const blockElement = el.closest<BlockElement>(`[${BLOCK_ID_ATTR}]`);
      if (blockElement) {
        return FORMAT_NATIVE_SUPPORT_FLAVOURS.includes(
          blockElement.model.flavour as Flavour
        );
      }
      return false;
    })
    .map(el => el.virgoEditor);
  return selectedVEditors.length > 0;
}
