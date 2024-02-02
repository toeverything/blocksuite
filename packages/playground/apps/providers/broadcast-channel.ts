import type { Workspace } from '@blocksuite/store';
import type { EventBasedChannel } from 'async-call-rpc';

import { createAsyncCallRPCProvider } from './async-call-rpc.js';

class BroadcastMessageChannel
  extends BroadcastChannel
  implements EventBasedChannel
{
  on(eventListener: (data: unknown) => void) {
    const f = (e: MessageEvent): void => eventListener(e.data);
    this.addEventListener('message', f);
    return () => this.removeEventListener('message', f);
  }
  send(data: unknown) {
    super.postMessage(data);
  }
}

export function setupBroadcastProvider(workspace: Workspace) {
  const channel = new BroadcastMessageChannel(workspace.id);
  const provider = createAsyncCallRPCProvider(workspace, channel);
  provider.connect();
  window.bcProvider = provider;
  return provider;
}
