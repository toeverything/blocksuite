import { createAsyncCallRPCProviderCreator } from './async-call-rpc.js';
import type { DocProviderCreator } from './type.js';

export const createBroadcastChannelProvider: DocProviderCreator = (...args) => {
  const id: string = args[0];
  const channelPromise = import(
    'async-call-rpc/utils/web/broadcast.channel.js'
  ).then(({ BroadcastMessageChannel }) => new BroadcastMessageChannel(id));
  return createAsyncCallRPCProviderCreator(
    'broadcast-channel',
    channelPromise,
    {
      cleanup: () => {
        channelPromise.then(channel => channel.close());
      },
    }
  )(...args);
};
