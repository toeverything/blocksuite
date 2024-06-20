import type { EditorHost } from '@blocksuite/block-std';
import { assertExists, sleep } from '@blocksuite/global/utils';
import type { InlineEditor } from '@blocksuite/inline';
import { BlockModel } from '@blocksuite/store';
import { css, unsafeCSS } from 'lit';

import { isControlledKeyboardEvent } from '../../_common/utils/event.js';
import { getInlineEditorByModel } from '../../_common/utils/query.js';
import { getCurrentNativeRange } from '../../_common/utils/selection.js';
import type { AffineInlineEditor } from '../inline/presets/affine-inline-specs.js';

export const createKeydownObserver = ({
  target,
  inlineEditor,
  onUpdateQuery,
  onMove,
  onConfirm,
  onEsc,
  interceptor = (_, next) => next(),
  abortController,
}: {
  target: HTMLElement;
  inlineEditor: InlineEditor;
  onUpdateQuery: (val: string) => void;
  onMove: (step: 1 | -1) => void;
  onConfirm: () => void;
  onEsc?: () => void;
  interceptor?: (e: KeyboardEvent, next: () => void) => void;
  abortController: AbortController;
}) => {
  let query = '';
  const startIndex = inlineEditor?.getInlineRange()?.index ?? 0;

  const updateQuery = async () => {
    // Wait for text update
    await sleep(0);
    const range = getCurrentNativeRange();
    if (!range) {
      abortController.abort();
      return;
    }
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
    const curIndex = inlineEditor.getInlineRange()?.index ?? 0;
    const text = inlineEditor.yText.toString();
    const previousQuery = query;
    query = text.slice(startIndex, curIndex);

    if (query !== previousQuery) {
      onUpdateQuery(query);
    }
  };

  const keyDownListener = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;

    if (isControlledKeyboardEvent(e)) {
      const isOnlyCmd = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
      // Ctrl/Cmd + alphabet key
      if (isOnlyCmd && e.key.length === 1) {
        switch (e.key) {
          // Previous command
          case 'p': {
            onMove(-1);
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          // Next command
          case 'n': {
            onMove(1);
            e.stopPropagation();
            e.preventDefault();
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
      // e.g. press ctrl + a to select all or press ctrl + v to paste
      abortController.abort();
      return;
    }

    e.stopPropagation();

    if (
      // input abc, 123, etc.
      (!isControlledKeyboardEvent(e) && e.key.length === 1) ||
      e.isComposing
    ) {
      updateQuery().catch(console.error);
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
        updateQuery().catch(console.error);
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
  target.addEventListener(
    'input',
    () => {
      updateQuery().catch(console.error);
    },
    {
      signal: abortController.signal,
    }
  );

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
  assertExists(inlineEditor, 'Inline editor not found');

  const inlineRange = inlineEditor.getInlineRange();
  assertExists(inlineRange);
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
  if (!container)
    throw new Error(
      'To prevent style pollution of the whole doc, you must add a container before the scrollbar style.'
    );

  // sanitize container name
  if (
    container.length > 50 ||
    container.includes('{') ||
    container.includes('}')
  )
    throw new Error('Invalid container name!');

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
