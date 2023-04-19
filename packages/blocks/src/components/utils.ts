import { isControlledKeyboardEvent } from '../__internal__/utils/std.js';

export const createKeydownObserver = ({
  target,
  onUpdateQuery,
  onMove,
  onConfirm,
  onEsc,
  interceptor = (e, next) => next(),
  abortController,
}: {
  target: HTMLElement;
  onUpdateQuery: (val: string) => void;
  onMove: (step: 1 | -1) => void;
  onConfirm: () => void;
  onEsc?: () => void;
  interceptor?: (e: KeyboardEvent, next: () => void) => void;
  abortController: AbortController;
}) => {
  let query = '';
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

    if (isControlledKeyboardEvent(e) || e.key.length !== 1) {
      switch (e.key) {
        case 'Escape': {
          abortController.abort();
          return;
        }
        case 'Backspace': {
          if (!query.length) {
            abortController.abort();
          }
          query = query.slice(0, -1);
          onUpdateQuery(query);
          return;
        }
        case 'Enter': {
          if (e.isComposing) {
            return;
          }
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
    }
    query += e.key;
    onUpdateQuery(query);
  };

  const listenerWithMiddleware = (e: KeyboardEvent) =>
    interceptor(e, () => keyDownListener(e));

  target.addEventListener('keydown', listenerWithMiddleware, {
    // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
    capture: true,
  });
  abortController.signal.addEventListener('abort', () => {
    target.removeEventListener('keydown', listenerWithMiddleware, {
      capture: true,
    });
  });

  if (onEsc) {
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEsc();
      }
    };
    window.addEventListener('keydown', escListener);
    abortController.signal.addEventListener('abort', () =>
      window.removeEventListener('keydown', escListener)
    );
  }
};
