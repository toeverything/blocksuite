import { BroadcastMessageChannel } from 'async-call-rpc/utils/web/broadcast.channel.js';

import { createAsyncCallRPCProviderCreator } from './async-call-rpc.js';
import type { DocProviderCreator } from './type.js';

export const createBroadcastChannelProvider: DocProviderCreator = (...args) => {
  const id: string = args[0];
  const broadcastMessageChannel = new BroadcastMessageChannel(id);
  return createAsyncCallRPCProviderCreator(
    'broadcast-channel',
    broadcastMessageChannel,
    {
      cleanup: () => {
        broadcastMessageChannel.close();
      },
    }
  )(...args);
};
