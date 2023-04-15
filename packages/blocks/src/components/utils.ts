import {
  isControlledKeyboardEvent,
  isPrintableKeyEvent,
} from '../__internal__/utils/std.js';

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
    if (
      // Abort when press modifier key to avoid weird behavior
      // e.g. press ctrl + a to select all or press ctrl + v to paste
      isControlledKeyboardEvent(e) ||
      e.key === 'Escape'
    ) {
      abortController.abort();
      return;
    }

    if (!isPrintableKeyEvent(e)) {
      switch (e.key) {
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
          onMove(-1);
          e.preventDefault();
          return;
        }
        case 'ArrowDown': {
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
