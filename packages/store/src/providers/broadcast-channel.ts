import type { EventBasedChannel } from 'async-call-rpc';

import { createAsyncCallRPCProviderCreator } from './async-call-rpc.js';
import type { DocProviderCreator } from './type.js';

export const createBroadcastChannelProvider: DocProviderCreator = (...args) => {
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

  const id: string = args[0];
  const channel = new BroadcastMessageChannel(id);
  return createAsyncCallRPCProviderCreator('broadcast-channel', channel, {
    cleanup: () => {
      channel.close();
    },
  })(...args);
};
