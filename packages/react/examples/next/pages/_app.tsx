import type { AppProps } from 'next/app';
import { BlockSuiteProvider, createBlockSuiteStore } from '@blocksuite/react';
import { Workspace } from '@blocksuite/store';
import { IndexedDBDocProvider } from '@blocksuite/store';
import { BlockSchema } from '@blocksuite/blocks/models';
import { NextUIProvider } from '@nextui-org/react';

const localWorkspace = new Workspace({
  room: 'local-room',
  isSSR: typeof window === 'undefined',
  providers: typeof window === 'undefined' ? [] : [IndexedDBDocProvider],
});

localWorkspace.register(BlockSchema);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <BlockSuiteProvider
      createStore={() => createBlockSuiteStore(localWorkspace)}
    >
      <NextUIProvider>
        <Component {...pageProps} />
      </NextUIProvider>
    </BlockSuiteProvider>
  );
}
