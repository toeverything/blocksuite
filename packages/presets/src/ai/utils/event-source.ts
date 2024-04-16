function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// do we really need to export this?
export function toTextStream(
  eventSource: EventSource,
  options: {
    timeout?: number;
    type?: 'attachment' | 'message';
  } = {}
): BlockSuitePresets.TextStream {
  const { timeout, type = 'message' } = options;
  return {
    [Symbol.asyncIterator]: async function* () {
      const messageQueue: string[] = [];
      let resolveMessagePromise: () => void;
      let messagePromise = new Promise<void>(
        resolve => (resolveMessagePromise = resolve)
      );

      eventSource.addEventListener(type, event => {
        messageQueue.push(event.data);
        resolveMessagePromise();
        messagePromise = new Promise(
          resolve => (resolveMessagePromise = resolve)
        );
      });

      eventSource.onerror = () => {
        resolveMessagePromise();
        eventSource.close();
      };

      try {
        while (eventSource.readyState !== EventSource.CLOSED) {
          if (messageQueue.length === 0) {
            // Wait for the next message or timeout
            await (timeout
              ? Promise.race([
                  messagePromise,
                  delay(timeout).then(() => {
                    throw new Error('Timeout');
                  }),
                ])
              : messagePromise);
          } else if (messageQueue.length > 0) {
            yield messageQueue.shift()!; // Yield the next message
          }
        }
      } finally {
        eventSource.close();
      }
    },
  };
}
