import type { BlockStdScope } from '@blocksuite/block-std';

import { NotificationProvider } from '@blocksuite/affine-shared/services';

import { toast } from '../toast/toast.js';

function notify(std: BlockStdScope, title: string, message: string) {
  const notification = std.getOptional(NotificationProvider);
  const { doc, host } = std;

  if (!notification) {
    toast(host, title);
    return;
  }

  const abortController = new AbortController();
  const clear = () => {
    doc.history.off('stack-item-added', addHandler);
    doc.history.off('stack-item-popped', popHandler);
    disposable.dispose();
  };
  const closeNotify = () => {
    abortController.abort();
    clear();
  };

  // edit or undo or switch doc, close notify toast
  const addHandler = doc.history.on('stack-item-added', closeNotify);
  const popHandler = doc.history.on('stack-item-popped', closeNotify);
  const disposable = host.slots.unmounted.on(closeNotify);

  notification.notify({
    title,
    message,
    accent: 'info',
    duration: 10 * 1000,
    action: {
      label: 'Undo',
      onClick: () => {
        doc.undo();
        clear();
      },
    },
    abort: abortController.signal,
    onClose: clear,
  });
}

export function notifyLinkedDocSwitchedToCard(std: BlockStdScope) {
  notify(
    std,
    'View Updated',
    'The alias modification has disabled sync. The embed has been updated to a card view.'
  );
}

export function notifyLinkedDocSwitchedToEmbed(std: BlockStdScope) {
  notify(
    std,
    'Embed View Restored',
    'Custom alias removed. The linked doc now displays the original title and description.'
  );
}

export function notifyLinkedDocClearedAliases(std: BlockStdScope) {
  notify(
    std,
    'Reset successful',
    `Card view has been restored to original doc title and description. All custom aliases have been removed.`
  );
}
