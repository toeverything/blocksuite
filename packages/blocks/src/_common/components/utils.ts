import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { EditorHost } from '@blocksuite/block-std';
import type { InlineEditor, InlineRange } from '@blocksuite/inline';

import { getInlineEditorByModel } from '@blocksuite/affine-components/rich-text';
import {
  getCurrentNativeRange,
  isControlledKeyboardEvent,
} from '@blocksuite/affine-shared/utils';
import { BlockModel } from '@blocksuite/store';
import { css, unsafeCSS } from 'lit';

export function getQuery(
  inlineEditor: InlineEditor,
  startRange: InlineRange | null
) {
  const nativeRange = getCurrentNativeRange();
  if (!nativeRange) {
    return null;
  }
  if (nativeRange.startContainer !== nativeRange.endContainer) {
    return null;
  }
  const curRange = inlineEditor.getInlineRange();
  if (!startRange || !curRange) {
    return null;
  }
  if (curRange.index < startRange.index) {
    return null;
  }
  const text = inlineEditor.yText.toString();
  return text.slice(startRange.index, curRange.index);
}

interface ObserverParams {
  target: HTMLElement;
  signal: AbortSignal;
  onInput?: (isComposition: boolean) => void;
  onDelete?: () => void;
  onMove?: (step: 1 | -1) => void;
  onConfirm?: () => void;
  onAbort?: () => void;
  onPaste?: () => void;
  interceptor?: (e: KeyboardEvent, next: () => void) => void;
}

export const createKeydownObserver = ({
  target,
  signal,
  onInput,
  onDelete,
  onMove,
  onConfirm,
  onAbort,
  onPaste,
  interceptor = (_, next) => next(),
}: ObserverParams) => {
  const keyDownListener = (e: KeyboardEvent) => {
    if (e.key === 'Process' || e.isComposing) return;

    if (e.defaultPrevented) return;

    if (isControlledKeyboardEvent(e)) {
      const isOnlyCmd = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
      // Ctrl/Cmd + alphabet key
      if (isOnlyCmd && e.key.length === 1) {
        switch (e.key) {
          // Previous command
          case 'p': {
            onMove?.(-1);
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          // Next command
          case 'n': {
            onMove?.(1);
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          // Paste command
          case 'v': {
            onPaste?.();
            return;
          }
        }
      }

      // Pressing **only** modifier key is allowed and will be ignored
      // Because we don't know the user's intention
      // Aborting here will cause the above hotkeys to not work
      if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt') {
        e.stopPropagation();
        return;
      }

      // Abort when press modifier key + any other key to avoid weird behavior
      // e.g. press ctrl + a to select all
      onAbort?.();
      return;
    }

    e.stopPropagation();

    if (
      // input abc, 123, etc.
      !isControlledKeyboardEvent(e) &&
      e.key.length === 1
    ) {
      onInput?.(false);
      return;
    }

    switch (e.key) {
      case 'Escape': {
        onAbort?.();
        return;
      }
      case 'Backspace': {
        onDelete?.();
        return;
      }
      case 'Enter': {
        if (e.shiftKey) {
          onAbort?.();
          return;
        }
        onConfirm?.();
        e.preventDefault();
        return;
      }
      case 'Tab': {
        if (e.shiftKey) {
          onMove?.(-1);
        } else {
          onMove?.(1);
        }
        e.preventDefault();
        return;
      }
      case 'ArrowUp': {
        if (e.shiftKey) {
          onAbort?.();
          return;
        }
        onMove?.(-1);
        e.preventDefault();
        return;
      }
      case 'ArrowDown': {
        if (e.shiftKey) {
          onAbort?.();
          return;
        }
        onMove?.(1);
        e.preventDefault();
        return;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        onAbort?.();
        return;
      }
      default:
        // Other control keys
        return;
    }
  };

  target.addEventListener(
    'keydown',
    (e: KeyboardEvent) => interceptor(e, () => keyDownListener(e)),
    {
      // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
      signal,
    }
  );

  // Fix paste input
  target.addEventListener('paste', () => onDelete?.(), { signal });

  // Fix composition input
  target.addEventListener('compositionend', () => onInput?.(true), { signal });
};

/**
 * Remove specified text from the current range.
 */
export function cleanSpecifiedTail(
  editorHost: EditorHost,
  inlineEditorOrModel: AffineInlineEditor | BlockModel,
  str: string
) {
  if (!str) {
    console.warn('Failed to clean text! Unexpected empty string');
    return;
  }
  const inlineEditor =
    inlineEditorOrModel instanceof BlockModel
      ? getInlineEditorByModel(editorHost, inlineEditorOrModel)
      : inlineEditorOrModel;
  if (!inlineEditor) {
    return;
  }
  const inlineRange = inlineEditor.getInlineRange();
  if (!inlineRange) {
    return;
  }
  const idx = inlineRange.index - str.length;
  const textStr = inlineEditor.yText.toString().slice(idx, idx + str.length);
  if (textStr !== str) {
    console.warn(
      `Failed to clean text! Text mismatch expected: ${str} but actual: ${textStr}`
    );
    return;
  }
  inlineEditor.deleteText({ index: idx, length: str.length });
  inlineEditor.setInlineRange({
    index: idx,
    length: 0,
  });
}

/**
 * You should add a container before the scrollbar style to prevent the style pollution of the whole doc.
 */
export const scrollbarStyle = (container: string) => {
  if (!container) {
    console.error(
      'To prevent style pollution of the whole doc, you must add a container before the scrollbar style.'
    );
    return css``;
  }

  // sanitize container name
  if (container.includes('{') || container.includes('}')) {
    console.error('Invalid container name! Please use a valid CSS selector.');
    return css``;
  }

  return css`
    ${unsafeCSS(container)} {
      scrollbar-gutter: stable;
    }
    ${unsafeCSS(container)}::-webkit-scrollbar {
      -webkit-appearance: none;
      width: 4px;
    }
    ${unsafeCSS(container)}::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background-color: #b1b1b1;
    }
    ${unsafeCSS(container)}::-webkit-scrollbar-corner {
      display: none;
    }
  `;
};
