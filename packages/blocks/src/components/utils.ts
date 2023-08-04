import { assertExists, sleep } from '@blocksuite/global/utils';
import { BaseBlockModel } from '@blocksuite/store';
import { css } from 'lit';

import type { RichText } from '../__internal__/rich-text/rich-text.js';
import type { AffineVEditor } from '../__internal__/rich-text/virgo/types.js';
import { isControlledKeyboardEvent } from '../__internal__/utils/common.js';
import { getVirgoByModel } from '../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../__internal__/utils/selection.js';

export const createKeydownObserver = ({
  target,
  onUpdateQuery,
  onMove,
  onConfirm,
  onEsc,
  interceptor = (e, next) => next(),
  abortController,
}: {
  target: RichText;
  onUpdateQuery: (val: string) => void;
  onMove: (step: 1 | -1) => void;
  onConfirm: () => void;
  onEsc?: () => void;
  interceptor?: (e: KeyboardEvent, next: () => void) => void;
  abortController: AbortController;
}) => {
  let query = '';
  const vEditor = target.vEditor;
  assertExists(
    vEditor,
    'Failed to observer keyboard! virgo editor is not exist.'
  );
  const startIndex = vEditor?.getVRange()?.index ?? 0;

  const updateQuery = async () => {
    // Wait for text update
    await sleep(0);
    const range = getCurrentNativeRange();
    if (range.startContainer !== range.endContainer) {
      console.warn(
        'Failed to parse query! Current range is not collapsed.',
        range
      );
      abortController.abort();
      return;
    }
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) {
      console.warn(
        'Failed to parse query! Current range is not a text node.',
        range
      );
      abortController.abort();
      return;
    }
    const curIndex = vEditor.getVRange()?.index ?? 0;
    const text = vEditor.yText.toString();
    const previousQuery = query;
    query = text.slice(startIndex, curIndex);

    if (query !== previousQuery) {
      onUpdateQuery(query);
    }
  };

  const keyDownListener = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.defaultPrevented) return;

    if (isControlledKeyboardEvent(e)) {
      const isOnlyCmd = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
      // Ctrl/Cmd + alphabet key
      if (isOnlyCmd && e.key.length === 1) {
        switch (e.key) {
          // Previous command
          case 'P':
          case 'p': {
            onMove(-1);
            e.preventDefault();
            return;
          }
          // Next command
          case 'N':
          case 'n': {
            onMove(1);
            e.preventDefault();
            return;
          }
        }
      }

      // Pressing **only** modifier key is allowed and will be ignored
      // Because we don't know the user's intention
      // Aborting here will cause the above hotkeys to not work
      if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt') {
        return;
      }

      // Abort when press modifier key + any other key to avoid weird behavior
      // e.g. press ctrl + a to select all or press ctrl + v to paste
      abortController.abort();
      return;
    }

    if (
      // input abc, 123, etc.
      (!isControlledKeyboardEvent(e) && e.key.length === 1) ||
      e.isComposing
    ) {
      updateQuery();
      return;
    }

    switch (e.key) {
      case 'Escape': {
        abortController.abort();
        return;
      }
      case 'Backspace': {
        if (!query.length) {
          abortController.abort();
        }
        updateQuery();
        return;
      }
      case 'Enter': {
        if (e.shiftKey) {
          abortController.abort();
          return;
        }
        onConfirm();
        e.preventDefault();
        return;
      }
      case 'Tab': {
        if (e.shiftKey) {
          onMove(-1);
        } else {
          onMove(1);
        }
        e.preventDefault();
        return;
      }
      case 'ArrowUp': {
        if (e.shiftKey) {
          abortController.abort();
          return;
        }
        onMove(-1);
        e.preventDefault();
        return;
      }
      case 'ArrowDown': {
        if (e.shiftKey) {
          abortController.abort();
          return;
        }
        onMove(1);
        e.preventDefault();
        return;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        abortController.abort();
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
      signal: abortController.signal,
    }
  );

  // Fix composition input
  target.addEventListener('input', updateQuery, {
    signal: abortController.signal,
  });

  if (onEsc) {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEsc();
      }
    };
    window.addEventListener('keydown', escListener, {
      signal: abortController.signal,
    });
  }
};

/**
 * Remove specified text from the current range.
 */
export function cleanSpecifiedTail(
  vEditorOrModel: AffineVEditor | BaseBlockModel,
  str: string
) {
  if (!str) {
    console.warn('Failed to clean text! Unexpected empty string');
    return;
  }
  const vEditor =
    vEditorOrModel instanceof BaseBlockModel
      ? getVirgoByModel(vEditorOrModel)
      : vEditorOrModel;
  assertExists(vEditor, 'Editor not found');

  const vRange = vEditor.getVRange();
  assertExists(vRange);
  const idx = vRange.index - str.length;
  const textStr = vEditor.yText.toString().slice(idx, idx + str.length);
  if (textStr !== str) {
    console.warn(
      `Failed to clean text! Text mismatch expected: ${str} but actual: ${textStr}`
    );
    return;
  }
  vEditor.deleteText({ index: idx, length: str.length });
  vEditor.setVRange({
    index: idx,
    length: 0,
  });
}

export const scrollbarStyle = css`
  ::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 4px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background-color: #b1b1b1;
  }
`;
