import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement, EditorHost } from '@blocksuite/lit';
import {
  VIRGO_ROOT_ATTR,
  type VirgoRootElement,
  type VRange,
} from '@blocksuite/virgo';

import type { Flavour } from '../../../models.js';
import type {
  AffineTextAttributes,
  AffineVEditor,
} from '../../components/rich-text/virgo/types.js';
import { BLOCK_ID_ATTR } from '../../consts.js';
import {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './consts.js';

function getCombinedFormatFromVEditors(
  vEditors: [AffineVEditor, VRange | null][]
): AffineTextAttributes {
  const formatArr: AffineTextAttributes[] = [];
  vEditors.forEach(([vEditor, vRange]) => {
    if (!vRange) return;

    const format = vEditor.getFormat(vRange);
    formatArr.push(format);
  });

  if (formatArr.length === 0) return {};

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

function getCombinedFormat(host: EditorHost): AffineTextAttributes {
  let result: AffineTextAttributes = {};

  host.std.command
    .pipe()
    .withHost()
    .try(chain => [
      // text selection, corresponding to `formatText` command
      chain
        .getTextSelection()
        .getSelectedBlocks({
          types: ['text'],
          filter: el =>
            FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
        })
        .inline((ctx, next) => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);

          const selectedVEditors = selectedBlocks.flatMap(el => {
            const vRoot = el.querySelector<
              VirgoRootElement<AffineTextAttributes>
            >(`[${VIRGO_ROOT_ATTR}]`);
            if (vRoot && vRoot.virgoEditor.getVRange()) {
              return vRoot.virgoEditor;
            }
            return [];
          });

          result = getCombinedFormatFromVEditors(
            selectedVEditors.map(e => [e, e.getVRange()])
          );

          next();
        }),
      // block selection, corresponding to `formatBlock` command
      chain
        .getBlockSelections()
        .getSelectedBlocks({
          types: ['block'],
          filter: el =>
            FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
        })
        .inline((ctx, next) => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);

          const selectedVEditors = selectedBlocks.flatMap(el => {
            const vRoot = el.querySelector<
              VirgoRootElement<AffineTextAttributes>
            >(`[${VIRGO_ROOT_ATTR}]`);
            if (vRoot) {
              return vRoot.virgoEditor;
            }
            return [];
          });

          result = getCombinedFormatFromVEditors(
            selectedVEditors.map(e => [
              e,
              {
                index: 0,
                length: e.yTextLength,
              },
            ])
          );

          next();
        }),
      // native selection, corresponding to `formatNative` command
      chain.inline(() => {
        const selectedVEditors = Array.from<VirgoRootElement>(
          host.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
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

        result = getCombinedFormatFromVEditors(
          selectedVEditors.map(e => [e, e.getVRange()])
        );
      }),
    ])
    .run();

  return result;
}

export function handleCommonStyle(
  host: EditorHost,
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >
) {
  const active = commonActiveWhen(host, key);
  const payload: {
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  } = {
    styles: {
      [key]: active ? null : true,
    },
  };
  host.std.command
    .pipe()
    .withHost()
    .try(chain => [
      chain.getTextSelection().formatText(payload),
      chain.getBlockSelections().formatBlock(payload),
      chain.formatNative(payload),
    ])
    .run();
}

export function commonActiveWhen(host: EditorHost, key: string) {
  const format = getCombinedFormat(host);
  return key in format;
}

export function isFormatSupported(host: EditorHost) {
  let result = false;

  host.std.command
    .pipe()
    .withHost()
    .try(chain => [
      // text selection, corresponding to `formatText` command
      chain
        .getTextSelection()
        .getSelectedBlocks({
          types: ['text'],
          filter: el =>
            FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
        })
        .inline((ctx, next) => {
          const { currentTextSelection, selectedBlocks } = ctx;
          assertExists(currentTextSelection);
          assertExists(selectedBlocks);

          if (currentTextSelection.isCollapsed()) return;

          const selectedVEditors = selectedBlocks.flatMap(el => {
            const vRoot = el.querySelector<
              VirgoRootElement<AffineTextAttributes>
            >(`[${VIRGO_ROOT_ATTR}]`);
            if (vRoot && vRoot.virgoEditor.getVRange()) {
              return vRoot.virgoEditor;
            }
            return [];
          });

          result = selectedVEditors.length > 0;
          next();
        }),
      // block selection, corresponding to `formatBlock` command
      chain
        .getBlockSelections()
        .getSelectedBlocks({
          types: ['block'],
          filter: el =>
            FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour as Flavour),
        })
        .inline((ctx, next) => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);

          const selectedVEditors = selectedBlocks.flatMap(el => {
            const vRoot = el.querySelector<
              VirgoRootElement<AffineTextAttributes>
            >(`[${VIRGO_ROOT_ATTR}]`);
            if (vRoot) {
              return vRoot.virgoEditor;
            }
            return [];
          });

          result = selectedVEditors.length > 0;
          next();
        }),
      // native selection, corresponding to `formatNative` command
      chain.inline(() => {
        const selectedVEditors = Array.from<VirgoRootElement>(
          host.querySelectorAll(`[${VIRGO_ROOT_ATTR}]`)
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

        result = selectedVEditors.length > 0;
      }),
    ])
    .run();

  return result;
}
